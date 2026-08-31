import assert from 'node:assert/strict'
import { generateKeyPair } from '@libp2p/crypto/keys'
import { multiaddr } from '@multiformats/multiaddr'
import { CarbonClubNode } from '../lib/index.js'

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
      console.log(JSON.stringify({
        ok: true,
        expectedPeerId,
        connectedPeers: status.connectedPeers,
        relayReservations: status.relayAddresses,
        transport: 'dns4/tcp/443/wss + Noise + Yamux + Circuit Relay v2',
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
