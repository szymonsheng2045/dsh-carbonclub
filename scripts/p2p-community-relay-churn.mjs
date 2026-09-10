// Exercise the shipped relay entrypoint, not a duplicate test-only router.
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { generateKeyPair } from '@libp2p/crypto/keys'
import { CarbonClubNode, HALL_SYNC_PROTOCOL } from '../lib/index.js'
import { createLibp2p } from 'libp2p'
import { webSockets } from '@libp2p/websockets'
import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { identify } from '@libp2p/identify'
import { multiaddr } from '@multiformats/multiaddr'

const directory = await mkdtemp(join(tmpdir(), 'carbon-relay-churn-'))
const relay = spawn(process.execPath, ['scripts/community-relay.mjs'], {
  cwd: new URL('..', import.meta.url),
  env: { ...process.env, CARBON_RELAY_KEY_FILE: join(directory, 'relay.key'), CARBON_RELAY_LISTEN: '/ip4/127.0.0.1/tcp/0/ws', CARBON_RELAY_ANNOUNCE: '', CARBON_RELAY_REVIEW_PORT: '0', CARBON_RELAY_REVIEW_TOKEN_FILE: '' },
  stdio: ['ignore', 'pipe', 'pipe'],
})
let output = ''
let errors = ''
let address
relay.stdout.on('data', chunk => { output += chunk })
relay.stderr.on('data', chunk => { errors += chunk })
const stopped = new Promise(resolve => relay.once('exit', resolve))
async function waitFor(check, label) {
  const deadline = Date.now() + 15_000
  while (Date.now() < deadline) {
    if (check()) return
    if (relay.exitCode !== null) throw Error(`Relay exited: ${errors}`)
    await delay(100)
  }
  throw Error(`Timeout: ${label}`)
}
let observer
let slowPeer
try {
  await waitFor(() => {
    const line = output.split('\n').find(line => line.includes('carbon-relay.ready'))
    if (!line) return false
    try { address = JSON.parse(line).addresses[0]; return Boolean(address) } catch { return false }
  }, 'relay ready')
  const options = { enableMdns: false, enableRelayReservations: false, bootstrapAddresses: [address], listenAddresses: ['/ip4/127.0.0.1/tcp/0/ws'] }
  observer = new CarbonClubNode(await generateKeyPair('Ed25519'), options)
  await observer.start()
  await waitFor(() => observer.status().connectedPeers > 0, 'observer connected')
  slowPeer = await createLibp2p({ transports: [webSockets()], connectionEncrypters: [noise()], streamMuxers: [yamux()], services: { identify: identify() } })
  const targets = [address, (await observer.createInvite()).addresses[0]]
  await Promise.all(targets.map(async target => {
    const stream = await slowPeer.dialProtocol(multiaddr(target), HALL_SYNC_PROTOCOL)
    const started = Date.now()
    stream.send(new Uint8Array([123])) // Begin a JSON request, then remain silent.
    let timer
    try {
      await Promise.race([
        (async () => { try { for await (const _ of stream) { /* no response expected */ } } catch { /* remote reset expected */ } })(),
        new Promise((_, reject) => { timer = setTimeout(() => reject(Error('Silent sync stream did not expire')), 15_000) }),
      ])
      assert.ok(Date.now() - started >= 9_000, 'the real watchdog, not an immediate protocol rejection, must expire the stream')
    } finally { clearTimeout(timer); stream.abort(new Error('test cleanup')) }
  }))
  await slowPeer.stop()
  console.log(JSON.stringify({ stage: 'silent-sync-deadline', targets: ['community-relay', 'client'], ok: true }))
  for (let cycle = 0; cycle < 16; cycle += 1) {
    const guest = new CarbonClubNode(await generateKeyPair('Ed25519'), options)
    try {
      await guest.start()
      await waitFor(() => guest.status().connectedPeers > 0, 'guest connected')
      await delay(1_500)
      await guest.joinHall({ name: `relay-churn-${cycle}` })
      const message = await guest.publishHallMessage({ body: `relay-churn-${cycle}` })
      await waitFor(() => observer.roomSnapshot().messages.some(item => item.id === message.id), `relay delivery cycle ${cycle}`)
      assert.equal(guest.status().connectedPeers, 1, 'guest must only connect to the relay')
      console.log(JSON.stringify({ stage: 'relay-churn-cycle', cycle }))
    } finally { await guest.stop() }
    await delay(300)
  }
  console.log(JSON.stringify({ ok: true, cycles: 16, scope: 'shipped community relay, loopback only; not WAN/500 users' }))
} finally {
  await slowPeer?.stop()
  await observer?.stop()
  relay.kill('SIGTERM')
  const timer = setTimeout(() => relay.kill('SIGKILL'), 5_000)
  await stopped
  clearTimeout(timer)
}
