import assert from 'node:assert/strict'
import { generateKeyPair } from '@libp2p/crypto/keys'
import { multiaddr } from '@multiformats/multiaddr'

// lib/index.js 静态依赖宿主提供的 @deepseek-ai/* 包；固定运行目录只装中继运行依赖，
// 在那里直接跑本探针会报 ERR_MODULE_NOT_FOUND。给出可操作的诊断而不是晦涩栈。
let CarbonClubNode
try {
  ;({ CarbonClubNode } = await import('../lib/index.js'))
} catch (error) {
  if (error && error.code === 'ERR_MODULE_NOT_FOUND') {
    console.error('probe-public-relay: 无法加载 lib/index.js（缺少宿主依赖 @deepseek-ai/*）。')
    console.error('本探针须在完整仓库检出（pnpm install，含 devDependencies）中运行，不能在固定运行目录内运行。')
    process.exit(2)
  }
  throw error
}

const address = process.env.CARBON_RELAY_PROBE_ADDRESS
const expectedPeerId = process.env.CARBON_RELAY_EXPECTED_PEER_ID
const timeoutMs = Number.parseInt(process.env.CARBON_RELAY_PROBE_TIMEOUT_MS ?? '30000', 10)

if (address === undefined || expectedPeerId === undefined) {
  throw new Error('CARBON_RELAY_PROBE_ADDRESS and CARBON_RELAY_EXPECTED_PEER_ID are required')
}
if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 5_000 || timeoutMs > 120_000) {
  throw new Error('CARBON_RELAY_PROBE_TIMEOUT_MS must be between 5000 and 120000')
}

const parsed = multiaddr(address)
assert.equal(parsed.toString(), address, 'probe address must be a canonical multiaddress')
assert.ok(address.endsWith(`/p2p/${expectedPeerId}`), 'probe address Peer ID does not match the expected relay')
assert.match(address, /^\/dns4\/[^/]+\/tcp\/443\/wss\/p2p\//, 'probe address must use public DNS, TCP 443 and WSS')

const client = new CarbonClubNode(await generateKeyPair('Ed25519'), {
  bootstrapAddresses: [address],
  enableMdns: false,
  enableRelayReservations: true,
})

const deadline = Date.now() + timeoutMs
let ready = false
try {
  await client.start()
  while (Date.now() < deadline) {
    const status = client.status()
    if (status.connectedPeers >= 1 && status.relayAddresses >= 1) {
      // Transport success alone must not certify a router on the old hall topic.
      await client.verifyPeerProtocol(expectedPeerId)
      console.log(JSON.stringify({
        ok: true,
        expectedPeerId,
        connectedPeers: status.connectedPeers,
        relayReservations: status.relayAddresses,
        transport: 'dns4/tcp/443/wss + Noise + Yamux + Circuit Relay v2',
        hallProtocol: '0.5.1',
      }))
      ready = true
      break
    }
    await new Promise(resolve => setTimeout(resolve, 250))
  }
  if (!ready) {
    throw new Error(`public relay probe timed out: ${JSON.stringify(client.status())}`)
  }
} finally {
  await client.stop()
}
