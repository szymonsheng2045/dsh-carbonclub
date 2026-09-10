import assert from 'node:assert/strict'
import { createServer, connect } from 'node:net'
import { setTimeout as delay } from 'node:timers/promises'
import { generateKeyPair } from '@libp2p/crypto/keys'
import { multiaddr } from '@multiformats/multiaddr'
import { CarbonClubNode } from '../lib/index.js'

// Existing libp2p + a loopback TCP proxy: no system firewall/network changes.
const options = { enableMdns: false, enableRelayReservations: false, listenAddresses: ['/ip4/127.0.0.1/tcp/0/ws'] }
const a = new CarbonClubNode(await generateKeyPair('Ed25519'), options)
const b = new CarbonClubNode(await generateKeyPair('Ed25519'), options)
const sockets = new Set(), timers = new Set()
let forwardedBytes = 0, delayedChunks = 0
const proxy = createServer(downstream => {
  const target = a.status().addresses.find(address => address.startsWith('/ip4/127.0.0.1/'))
  const upstream = connect({ host: '127.0.0.1', port: Number(target.split('/')[4]) })
  sockets.add(downstream); sockets.add(upstream)
  function pipe(source, destination) {
    source.on('data', chunk => {
      source.pause()
      const timer = setTimeout(() => {
        timers.delete(timer)
        if (destination.destroyed) return
        forwardedBytes += chunk.length; delayedChunks++
        if (destination.write(chunk)) source.resume()
        else destination.once('drain', () => source.resume())
      }, 150)
      timers.add(timer)
    })
    source.on('error', () => destination.destroy())
    source.on('close', () => { sockets.delete(source); destination.destroy() })
  }
  pipe(downstream, upstream); pipe(upstream, downstream)
})
async function until(check, name, ms = 20000) {
  const end = Date.now() + ms
  while (Date.now() < end) { if (check()) return; await delay(100) }
  throw Error(`Timed out: ${name}`)
}
try {
  await Promise.all([a.start(), b.start()])
  await new Promise(resolve => proxy.listen(0, '127.0.0.1', resolve))
  const address = `/ip4/127.0.0.1/tcp/${proxy.address().port}/ws/p2p/${a.status().peerId}`
  // Test seam into the real transport, to route through a controlled proxy.
  await b.node.dial(multiaddr(address), { signal: AbortSignal.timeout(15000) })
  await delay(1500)
  await a.joinHall({ name: 'latency-A' }); await b.joinHall({ name: 'latency-B' })
  await until(() => a.roomSnapshot().participantCount === 2 && b.roomSnapshot().participantCount === 2, 'join over delayed link')
  const sent = await a.publishHallMessage({ body: 'delayed link' })
  await until(() => b.roomSnapshot().messages.some(message => message.id === sent.id), 'delayed message')
  assert.ok(delayedChunks > 0 && forwardedBytes > 0)
  for (const socket of sockets) socket.destroy()
  await new Promise(resolve => proxy.close(resolve))
  // A user can recover with a fresh signed invite even if the old path vanishes.
  await b.connect((await a.createInvite()).code)
  await until(() => a.status().connectedPeers > 0 && b.status().connectedPeers > 0, 'reconnected')
  await delay(1500)
  const reply = await b.publishHallMessage({ body: 'recovered via fresh invite' })
  await until(() => a.roomSnapshot().messages.some(message => message.id === reply.id), 'post-recovery reply')
  console.log(JSON.stringify({ ok: true, latencyPerChunkMs: 150, delayedChunks, forwardedBytes, recovery: 'fresh signed direct invite after proxy connection loss', scope: 'loopback TCP delay and disconnect; not random WAN packet loss' }))
} finally {
  for (const timer of timers) clearTimeout(timer)
  for (const socket of sockets) socket.destroy()
  proxy.close()
  await Promise.allSettled([a.stop(), b.stop()])
}
