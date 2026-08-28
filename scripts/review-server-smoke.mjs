import { chmod, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { startReviewServer, stopReviewServer } from './review-server.mjs'

const directory = await mkdtemp(join(tmpdir(), 'carbon-review-'))
const tokenFile = join(directory, 'review.token')
const token = 'review-token-for-smoke-test-0000000000000000000000000000'
let server

try {
  await writeFile(tokenFile, token, { mode: 0o600 })
  await chmod(tokenFile, 0o600)
  server = await startReviewServer({
    port: 0,
    tokenFile,
    report: () => ({ ok: true, privacy: { rawMessages: false, privateKeys: false, remoteControl: false } }),
  })
  const address = server.address()
  if (address === null || typeof address === 'string') throw new Error('Review server did not expose an IP port')
  const base = `http://127.0.0.1:${address.port}`

  const health = await fetch(`${base}/healthz`)
  if (health.status !== 204) throw new Error(`Expected health status 204, received ${health.status}`)
  const unauthorized = await fetch(`${base}/review/v1/report`)
  if (unauthorized.status !== 401) throw new Error(`Expected unauthenticated status 401, received ${unauthorized.status}`)
  const reviewed = await fetch(`${base}/review/v1/report`, { headers: { authorization: `Bearer ${token}` } })
  const report = await reviewed.json()
  if (reviewed.status !== 200 || report.ok !== true || report.privacy?.remoteControl !== false) throw new Error('Authenticated review report failed its safety contract')
  const mutation = await fetch(`${base}/review/v1/report`, { method: 'POST', headers: { authorization: `Bearer ${token}` } })
  if (mutation.status !== 405) throw new Error(`Expected mutation status 405, received ${mutation.status}`)
  console.log(JSON.stringify({ event: 'carbon-relay.review-smoke.ok', loopbackOnly: true, tokenRequired: true, remoteControl: false }))
} finally {
  await stopReviewServer(server)
  await rm(directory, { recursive: true, force: true })
}
