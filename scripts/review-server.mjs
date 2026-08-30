import { timingSafeEqual } from 'node:crypto'
import { lstat, readFile } from 'node:fs/promises'
import { createServer } from 'node:http'

function authorized(request, token) {
  const header = request.headers.authorization ?? ''
  const candidate = header.startsWith('Bearer ') ? Buffer.from(header.slice(7).trim()) : Buffer.alloc(0)
  return candidate.byteLength === token.byteLength && timingSafeEqual(candidate, token)
}

function respond(response, statusCode, body = undefined) {
  response.statusCode = statusCode
  response.setHeader('cache-control', 'no-store')
  response.setHeader('x-content-type-options', 'nosniff')
  if (body === undefined) {
    response.end()
    return
  }
  response.setHeader('content-type', 'application/json; charset=utf-8')
  response.end(`${JSON.stringify(body)}\n`)
}

export async function startReviewServer({ port, tokenFile, report }) {
  if (!Number.isInteger(port) || port < 0 || port > 65_535) throw new Error('Review port must be an integer between 0 and 65535')
  if (typeof report !== 'function') throw new Error('Review report provider is required')
  const tokenMetadata = await lstat(tokenFile)
  if (!tokenMetadata.isFile() || tokenMetadata.isSymbolicLink()) throw new Error('Review token must be a regular, non-symlink file')
  if ((tokenMetadata.mode & 0o077) !== 0) throw new Error('Review token permissions must not grant group or other access')
  if (typeof process.getuid === 'function' && tokenMetadata.uid !== process.getuid()) throw new Error('Review token must be owned by the service user')
  const token = Buffer.from((await readFile(tokenFile, 'utf8')).trim())
  if (token.byteLength < 32) throw new Error('Review token must contain at least 32 bytes')

  const server = createServer((request, response) => {
    if (request.method !== 'GET') {
      respond(response, 405, { error: 'method_not_allowed' })
      return
    }
    if (request.url === '/healthz') {
      respond(response, 204)
      return
    }
    if (request.url !== '/review/v1/report') {
      respond(response, 404, { error: 'not_found' })
      return
    }
    if (!authorized(request, token)) {
      respond(response, 401, { error: 'unauthorized' })
      return
    }
    try {
      respond(response, 200, report())
    } catch {
      respond(response, 503, { error: 'report_unavailable' })
    }
  })
  server.maxHeadersCount = 24
  server.headersTimeout = 5_000
  server.requestTimeout = 5_000

  await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(port, '127.0.0.1', () => {
      server.off('error', reject)
      resolve()
    })
  })
  return server
}

export async function stopReviewServer(server) {
  if (server === undefined) return
  await new Promise((resolve, reject) => server.close(error => error === undefined ? resolve() : reject(error)))
}
