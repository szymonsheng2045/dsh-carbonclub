import assert from 'node:assert/strict'
import { fork } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { generateKeyPair } from '@libp2p/crypto/keys'
import { CarbonClubNode } from '../lib/index.js'

// Test-only child control, never a network endpoint or production RPC.
if (process.argv.includes('--worker')) {
  const node = new CarbonClubNode(await generateKeyPair('Ed25519'), {
    enableMdns: false, enableRelayReservations: false,
    listenAddresses: ['/ip4/127.0.0.1/tcp/0/ws'],
  })
  await node.start()
  process.on('message', async ({ id, op, value }) => {
    try {
      let result
      if (op === 'invite') result = await node.createInvite()
      else if (op === 'connect') result = await node.connect(value)
      else if (op === 'join') result = await node.joinHall({ name: value })
      else if (op === 'leave') result = await node.leaveHall()
      else if (op === 'send') result = await node.publishHallMessage({ body: value })
      else if (op === 'snapshot') result = node.roomSnapshot()
      else if (op === 'status') result = { ...node.status(), rss: process.memoryUsage().rss }
      else if (op === 'stop') { await node.stop(); process.send({ id, result: true }); process.exit(0) }
      else throw Error('Unknown test operation')
      process.send({ id, result })
    } catch (error) { process.send({ id, error: error.message }) }
  })
  process.send({ ready: true })
} else {
  const durationSeconds = Number(process.env.CARBON_SOAK_SECONDS ?? 600)
  assert.ok(Number.isFinite(durationSeconds) && durationSeconds >= 180 && durationSeconds <= 86400)
  const children = []
  let id = 0
  async function worker() {
    const child = fork(new URL(import.meta.url), ['--worker'], { stdio: ['ignore', 'inherit', 'inherit', 'ipc'] })
    children.push(child)
    const pending = new Map()
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(Error('worker startup timeout')), 15000)
      child.on('message', message => {
        if (message.ready) { clearTimeout(timer); resolve() }
        else pending.get(message.id)?.(message)
      })
      child.once('exit', code => { clearTimeout(timer); reject(Error(`worker exited: ${code}`)) })
    })
    return { child, call(op, value) {
      return new Promise((resolve, reject) => {
        const requestId = ++id
        const timer = setTimeout(() => { pending.delete(requestId); reject(Error(`${op} timeout`)) }, 15000)
        pending.set(requestId, message => { clearTimeout(timer); pending.delete(requestId); message.error ? reject(Error(message.error)) : resolve(message.result) })
        child.send({ id: requestId, op, value })
      })
    } }
  }
  async function until(check, ms = 12000) {
    const end = Date.now() + ms
    while (Date.now() < end) { if (await check()) return; await delay(200) }
    throw Error('replication/recovery deadline exceeded')
  }
  const started = Date.now()
  try {
    const a = await worker(), b = await worker()
    await b.call('connect', (await a.call('invite')).code)
    await delay(1800)
    await a.call('join', 'soak-A'); await b.call('join', 'soak-B')
    await until(async () => (await a.call('snapshot')).participantCount === 2 && (await b.call('snapshot')).participantCount === 2)
    const sent = await a.call('send', 'before suspension')
    await until(async () => (await b.call('snapshot')).messages.some(m => m.id === sent.id))
    const before = await a.call('status')
    // Suspend only our child process, not the Mac, the network, or the user's DSH.
    b.child.kill('SIGSTOP')
    console.log(JSON.stringify({ stage: 'suspended-own-worker', seconds: 130 }))
    await delay(130000)
    const expired = await a.call('snapshot')
    assert.equal(expired.participantCount, 0, 'idle/suspended seats expire')
    b.child.kill('SIGCONT')
    await assert.rejects(b.call('join', 'soak-B'), /HALL_COOLDOWN/)
    await b.call('connect', (await a.call('invite')).code)
    await until(async () => (await b.call('snapshot')).messages.some(m => m.id === sent.id))
    console.log(JSON.stringify({ stage: 'resumed', cooldownEnforced: true, historyRetained: true }))
    // New isolated observers exercise late sync without bypassing expired users' cooldowns.
    let cycles = 0, peakRss = before.rss
    while (Date.now() - started < durationSeconds * 1000) {
      const observer = await worker()
      await observer.call('connect', (await a.call('invite')).code)
      await delay(1500)
      await observer.call('join', `late-${cycles}`)
      await until(async () => (await a.call('snapshot')).participantCount > 0)
      const fresh = await observer.call('send', `fresh-${cycles}`)
      await until(async () => (await a.call('snapshot')).messages.some(m => m.id === fresh.id))
      const reader = await worker()
      await reader.call('connect', (await a.call('invite')).code)
      await until(async () => (await reader.call('snapshot')).messages.some(m => m.id === fresh.id))
      const after = await a.call('status')
      peakRss = Math.max(peakRss, after.rss)
      assert.ok(after.connectedPeers <= 64)
      await observer.call('stop')
      await reader.call('stop')
      cycles++
      console.log(JSON.stringify({ stage: 'late-reconnect', cycles, elapsedSeconds: Math.round((Date.now() - started) / 1000), rssMiB: Math.round(after.rss / 1048576) }))
      await delay(Math.min(20000, Math.max(0, durationSeconds * 1000 - (Date.now() - started))))
    }
    console.log(JSON.stringify({ ok: true, durationSeconds: Math.round((Date.now() - started) / 1000), lateJoinCycles: cycles, initialRssMiB: before.rss / 1048576, peakRssMiB: peakRss / 1048576, scope: 'loopback, real child-process suspension; not WAN or physical Mac sleep' }))
  } finally {
    for (const child of children) if (child.exitCode === null) { child.kill('SIGCONT'); child.kill('SIGTERM') }
  }
}
