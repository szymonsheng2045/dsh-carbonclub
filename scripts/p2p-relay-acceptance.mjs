import assert from 'node:assert/strict'
import { generateKeyPair } from '@libp2p/crypto/keys'
import { multiaddr } from '@multiformats/multiaddr'
import { CarbonClubNode } from '../lib/index.js'

// 实装验收（双客户端）：A 连接/预约/协议核验 → A 进大厅并逐跳确认送达中继 →
// A 发布消息 → 后来者 B 经中继同步读到该消息。
//
// 背景约束（2026-09-10 排障结论）：
// - 客户端 gossipsub 允许向零主题节点静默发布（allowPublishToZeroTopicPeers），
//   mesh 未就绪时 join/消息会静默丢失；中继侧 topicPeers 只证明订阅到达，不证明 mesh 就绪。
// - 大厅规则：slowModeMs=8s（同座位发言间隔）、maxConsecutiveMessages=2（同源连发上限），
//   重试必须遵守间隔且同一客户端最多连发 2 条。
// 因此本脚本以中继侧留存确认为主信号（提供 review token 时），逐跳推进，不做盲目重试。
//
// 用法（回环与公网均可）：
//   CARBON_RELAY_ACCEPT_ADDRESS=/dns4/relay-051.laozi.art/tcp/443/wss/p2p/<PeerID> \
//   CARBON_RELAY_EXPECTED_PEER_ID=<PeerID> \
//   [CARBON_RELAY_REVIEW_TOKEN_FILE=~/.local/share/dsh-carbon-club/review-051.token] \
//   [CARBON_RELAY_REVIEW_URL=http://127.0.0.1:9093/review/v1/report] \
//   node scripts/p2p-relay-acceptance.mjs

const address = process.env.CARBON_RELAY_ACCEPT_ADDRESS
const expectedPeerId = process.env.CARBON_RELAY_EXPECTED_PEER_ID
const reviewTokenFile = process.env.CARBON_RELAY_REVIEW_TOKEN_FILE
const reviewUrl = process.env.CARBON_RELAY_REVIEW_URL ?? 'http://127.0.0.1:9093/review/v1/report'

if (address === undefined || expectedPeerId === undefined) {
  throw new Error('CARBON_RELAY_ACCEPT_ADDRESS and CARBON_RELAY_EXPECTED_PEER_ID are required')
}
const parsed = multiaddr(address)
assert.equal(parsed.toString(), address, 'acceptance address must be a canonical multiaddress')
assert.ok(address.endsWith(`/p2p/${expectedPeerId}`), 'acceptance address Peer ID does not match the expected relay')
assert.ok(
  /^\/dns4\/[^/]+\/tcp\/443\/wss\/p2p\//.test(address) || /^\/ip4\/127\.0\.0\.1\/tcp\/\d+\/ws\/p2p\//.test(address),
  'acceptance address must be public dns4/tcp/443/wss or loopback ip4/127.0.0.1 ws',
)

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
const t0 = Date.now()
const elapsed = () => Math.round((Date.now() - t0) / 100) / 10

// 中继侧观测（可选，需 review token）
let relayHealth = null
if (reviewTokenFile !== undefined) {
  const { readFile } = await import('node:fs/promises')
  const token = (await readFile(reviewTokenFile, 'utf8')).trim()
  relayHealth = async () => {
    const response = await fetch(reviewUrl, { headers: { authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(5_000) })
    return (await response.json()).health
  }
}

async function waitFor(check, what, budgetMs) {
  const deadline = Date.now() + budgetMs
  for (;;) {
    const value = await check()
    if (value) return value
    if (Date.now() >= deadline) throw new Error(`acceptance timeout: ${what}`)
    await sleep(300)
  }
}
// 中继留存增加 expected 条（仅 token 模式可用）
async function waitRetained(before, expected, what, budgetMs) {
  await waitFor(async () => (await relayHealth()).retainedEvents >= before + expected, what, budgetMs)
}

const clientOptions = { bootstrapAddresses: [address], enableMdns: false, enableRelayReservations: true }
const clientA = new CarbonClubNode(await generateKeyPair('Ed25519'), clientOptions)
const clientB = new CarbonClubNode(await generateKeyPair('Ed25519'), clientOptions)
const result = { ok: false, address, expectedPeerId }

try {
  await clientA.start()
  await waitFor(() => {
    const status = clientA.status()
    return status.connectedPeers >= 1 && status.relayAddresses >= 1
  }, 'client A connect + relay reservation', 30_000)
  await clientA.verifyPeerProtocol(expectedPeerId)
  result.transportVerified = true
  await clientB.start()
  await waitFor(() => clientB.status().connectedPeers >= 1, 'client B connect', 30_000)
  result.connectedAt = elapsed()

  if (relayHealth !== null) {
    // token 模式：逐跳中继侧确认
    await waitFor(async () => (await relayHealth()).topicPeers >= 2, 'relay sees both subscriptions', 30_000)
    const beforeJoin = (await relayHealth()).retainedEvents
    await clientA.joinHall({ name: 'relay-acceptance-a' })
    await waitRetained(beforeJoin, 1, 'relay retained A join presence', 30_000)
    result.joinDeliveredAt = elapsed()

    const beforeMessage = beforeJoin + 1
    const body = `relay-acceptance-${Date.now()}`
    const sent = await clientA.publishHallMessage({ body })
    await waitRetained(beforeMessage, 1, 'relay retained A message', 30_000)
    result.messageDeliveredAt = elapsed()
    await waitFor(
      () => clientB.roomSnapshot().messages.some(message => message.id === sent.id),
      'client B sync of published message',
      30_000,
    )
    result.syncedEventId = sent.id
  } else {
    // 无 token 降级模式：沉降等待 + 遵守大厅规则的两次机会
    await sleep(12_000)
    await clientA.joinHall({ name: 'relay-acceptance-a' })
    await sleep(8_500)
    const body = `relay-acceptance-${Date.now()}`
    const sentIds = []
    const attemptErrors = []
    let synced = null
    let lastPublishAt = 0
    for (let attempt = 1; attempt <= 2 && synced === null; attempt++) {
      const spacingWait = 8_500 - (Date.now() - lastPublishAt)
      if (sentIds.length > 0 && spacingWait > 0) await sleep(spacingWait)
      try {
        const sent = await clientA.publishHallMessage({ body })
        lastPublishAt = Date.now()
        sentIds.push(sent.id)
      } catch (error) {
        attemptErrors.push(String(error?.message ?? error))
        continue
      }
      try {
        await waitFor(
          () => clientB.roomSnapshot().messages.some(message => sentIds.includes(message.id)),
          'client B sync of published message',
          20_000,
        )
        synced = sentIds[sentIds.length - 1]
      } catch {}
    }
    result.publishAttempts = sentIds.length
    if (attemptErrors.length > 0) result.publishErrors = attemptErrors
    if (synced === null) throw new Error(`message never synced to late-joining client after ${sentIds.length} publish attempts`)
    result.syncedEventId = synced
  }

  result.lateJoinerSync = true
  result.ok = true
  console.log(JSON.stringify(result))
} catch (error) {
  result.error = String(error?.message ?? error)
  result.diagnostics = {
    aStatus: clientA.status(),
    bStatus: clientB.status(),
    bMessageCount: clientB.roomSnapshot().messages.length,
  }
  console.error(JSON.stringify(result))
  process.exitCode = 1
} finally {
  await Promise.allSettled([clientA.stop(), clientB.stop()])
}
