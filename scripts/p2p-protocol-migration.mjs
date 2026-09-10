// Real archived 0.5.0 package versus current 0.5.1, entirely on loopback.
// The archived package is supplied explicitly; never fetch or deploy implicitly.
import assert from 'node:assert/strict'
import { mkdtemp, symlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { spawnSync } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { generateKeyPair } from '@libp2p/crypto/keys'
import { CarbonClubNode } from '../lib/index.js'

const archive = process.argv[2]
assert.ok(archive, 'Pass the trusted archived 0.5.0-beta.2 tgz path')
const directory = await mkdtemp(join(tmpdir(), 'carbon-migration-'))
const listing = spawnSync('tar', ['-tzf', resolve(archive)], { encoding: 'utf8' })
assert.equal(listing.status, 0)
assert.ok(listing.stdout.trim().split('\n').every(path => path.startsWith('package/') && !path.split('/').includes('..')), 'unsafe archive path')
assert.equal(spawnSync('tar', ['-xzf', resolve(archive), '-C', directory]).status, 0)
await symlink(resolve('node_modules'), join(directory, 'package/node_modules'), 'dir')
const { CarbonClubNode: OldNode, HALL_TOPIC: oldTopic } = await import(pathToFileURL(join(directory, 'package/lib/index.js')).href)
assert.ok(oldTopic.endsWith('/0.5.0'))
const options = { enableMdns: false, enableRelayReservations: false, listenAddresses: ['/ip4/127.0.0.1/tcp/0/ws'] }
const old = new OldNode(await generateKeyPair('Ed25519'), options)
const fresh = new CarbonClubNode(await generateKeyPair('Ed25519'), options)
let observer
async function until(check) {
  const deadline = Date.now() + 15_000
  while (Date.now() < deadline) { if (check()) return; await delay(100) }
  throw Error('migration replication deadline')
}
try {
  await old.start()
  await fresh.start()
  const oldInvite = await old.createInvite()
  await assert.rejects(fresh.connect(oldInvite.code), /HALL_PROTOCOL_MISMATCH/)
  await assert.rejects(old.connect((await fresh.createInvite()).code))
  observer = new CarbonClubNode(await generateKeyPair('Ed25519'), { ...options, bootstrapAddresses: oldInvite.addresses })
  await observer.start()
  await until(() => observer.status().connectedPeers > 0)
  await assert.rejects(observer.verifyPeerProtocol(old.status().peerId), /HALL_PROTOCOL_MISMATCH/)
  await old.joinHall({ name: 'old-hall-only' })
  const oldMessage = await old.publishHallMessage({ body: 'This stays on the old protocol.' })
  await delay(1_500)
  assert.ok(!observer.roomSnapshot().messages.some(message => message.id === oldMessage.id))
  await observer.connect((await fresh.createInvite()).code)
  await delay(1_500)
  await fresh.joinHall({ name: 'new-hall-only' })
  const message = await fresh.publishHallMessage({ body: 'New protocol works alongside the old one.' })
  await until(() => observer.roomSnapshot().messages.some(item => item.id === message.id))
  assert.ok(!old.roomSnapshot().messages.some(item => item.id === message.id))
  console.log(JSON.stringify({ ok: true, oldInviteRejected: true, newInviteRejectedByOld: true, oldRouterDetected: true, newHallDelivery: true, noHistoryBridge: true, scope: 'local archived package coexistence; no production migration' }))
} finally { await Promise.all([old.stop(), fresh.stop(), observer?.stop()]) }
