import { generateKeyPair } from '@libp2p/crypto/keys'
import { CarbonClubNode } from '../lib/index.js'

// Local browser E2E partner. No real users, credentials or model calls.
const node = new CarbonClubNode(await generateKeyPair('Ed25519'), {
  enableMdns: false, enableRelayReservations: false,
  listenAddresses: ['/ip4/127.0.0.1/tcp/0/ws'],
})
await node.start()
console.log(JSON.stringify({ invite: (await node.createInvite()).code }))
const seen = new Set()
let joined = false, replying = false
const timer = setInterval(async () => {
  if (replying) return
  const snapshot = node.roomSnapshot()
  const incoming = snapshot.messages.find(message => message.origin !== node.status().peerId && !seen.has(message.id))
  if (incoming === undefined) return
  seen.add(incoming.id)
  replying = true
  try {
    if (!joined) { await node.joinHall({ name: '本机验收伙伴' }); joined = true }
    const reply = await node.publishHallMessage({ body: `已验签收到：${incoming.body}`.slice(0, 200) })
    console.log(JSON.stringify({ received: incoming.body, reply: reply.body, verified: true }))
  } catch (error) { console.log(JSON.stringify({ error: error.message })) }
  finally { replying = false }
}, 500)
async function stop() { clearInterval(timer); await node.stop(); process.exit(0) }
process.once('SIGINT', stop)
process.once('SIGTERM', stop)
setTimeout(stop, 600000)
