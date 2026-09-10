// Loopback churn regression: sixteen sequential join/leave cycles must all deliver.
// Guards against gossipsub graylisting honest churn from one shared address
// (stale disconnected-peer IPs accumulate for up to retainScore and previously
// crossed the graylist threshold at the fifteenth peer, silently dropping RPCs).
import assert from 'node:assert/strict'
import { setTimeout as delay } from 'node:timers/promises'
import { generateKeyPair } from '@libp2p/crypto/keys'
import { CarbonClubNode } from '../lib/index.js'

const CHURN_CYCLES = 16
const JOIN_DELIVERY_DEADLINE_MS = 12_000

const options = { enableMdns: false, enableRelayReservations: false, listenAddresses: ['/ip4/127.0.0.1/tcp/0/ws'] }
const host = new CarbonClubNode(await generateKeyPair('Ed25519'), options)
await host.start()
const started = Date.now()
try {
  for (let cycle = 0; cycle < CHURN_CYCLES; cycle += 1) {
    const guest = new CarbonClubNode(await generateKeyPair('Ed25519'), options)
    try {
    await guest.start()
    await guest.connect((await host.createInvite()).code)
    await delay(1_500)
    await guest.joinHall({ name: `churn-${cycle}` })
    const message = await guest.publishHallMessage({ body: `churn-${cycle}` })
    const deadline = Date.now() + JOIN_DELIVERY_DEADLINE_MS
    while (!host.roomSnapshot().messages.some(item => item.id === message.id) && Date.now() < deadline) await delay(200)
    assert.ok(host.roomSnapshot().messages.some(item => item.id === message.id), `cycle ${cycle}: host never saw this guest's message`)
    } finally {
    await guest.stop()
    }
    assert.ok(host.status().connectedPeers <= 4, `cycle ${cycle}: host connections leaked`)
    console.log(JSON.stringify({ stage: 'churn-cycle', cycle, elapsedSeconds: Math.round((Date.now() - started) / 1000) }))
    await delay(300)
  }
  console.log(JSON.stringify({ ok: true, cycles: CHURN_CYCLES, elapsedSeconds: Math.round((Date.now() - started) / 1000), scope: 'loopback join/leave churn; not WAN or NAT' }))
} finally {
  await host.stop()
}
