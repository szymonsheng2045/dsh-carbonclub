import { afterEach, describe, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { checkReleaseReadme, verifyReleaseCandidate } from '../scripts/check-release-readiness.mjs'

// A syntactically valid fixture identity, never dialed by this read-only test.
const peerId = '12D3KooWJ8PKcQPkfKDGSQyUuihCjFm7uRfSAnPtM4CjTXQdGLQA'
const manifest = { name: 'dsh-human-buffer', version: '0.5.1-beta.1', files: ['lib', 'scripts/community-relay.mjs'] }
const doc = `https://github.com/szymonsheng2045/dsh-carbonclub/releases/download/v${manifest.version}/${manifest.name}-${manifest.version}.tgz\n/dns4/relay-051.laozi.art/tcp/443/wss/p2p/${peerId}\n`
const temporary = []
afterEach(async () => { await Promise.all(temporary.splice(0).map(path => rm(path, { recursive: true, force: true }))) })

async function fixture({ packedDoc = doc, packedManifest = manifest, packedRuntime = 'export const tested = true\n', packedRelay = '// verified relay\n', omitRuntime = false } = {}) {
  const directory = await mkdtemp(join(tmpdir(), 'carbon-release-gate-test-'))
  temporary.push(directory)
  const root = join(directory, 'workspace')
  const pack = join(directory, 'package')
  const marker = `lib/build-${'a'.repeat(64)}.marker`
  for (const base of [root, pack]) {
    await mkdir(join(base, 'lib'), { recursive: true })
    await mkdir(join(base, 'scripts'), { recursive: true })
    await writeFile(join(base, 'package.json'), JSON.stringify(base === root ? manifest : packedManifest))
    for (const name of ['README.md', 'README.zh.md']) await writeFile(join(base, name), base === root ? doc : packedDoc)
    await writeFile(join(base, marker), 'a'.repeat(64))
    if (base === root || !omitRuntime) await writeFile(join(base, 'lib/index.js'), base === root ? 'export const tested = true\n' : packedRuntime)
    await writeFile(join(base, 'scripts/community-relay.mjs'), base === root ? '// verified relay\n' : packedRelay)
  }
  const archive = join(directory, 'candidate.tgz')
  const result = spawnSync('tar', ['-czf', archive, '-C', directory, 'package'], { encoding: 'utf8' })
  expect(result.status, result.stderr).toBe(0)
  const sha256 = createHash('sha256').update(await readFile(archive)).digest('hex')
  return { root, archive, sha256, peerId }
}

describe('exact release artifact gate', () => {
  it('passes matching archive, both READMEs, identity and runtime without unpacking', async () => {
    expect(await verifyReleaseCandidate(await fixture())).toMatchObject({ ok: true, version: manifest.version })
  })
  it('rejects workspace-only invocation', async () => {
    await expect(verifyReleaseCandidate({})).rejects.toThrow('exact final tgz')
  })
  it('rejects an archive whose hash differs from the approved digest', async () => {
    await expect(verifyReleaseCandidate({ ...await fixture(), sha256: '0'.repeat(64) })).rejects.toThrow('SHA-256 mismatch')
  })
  it('catches a README-only workspace fix while old text remains inside the tgz', async () => {
    await expect(verifyReleaseCandidate(await fixture({ packedDoc: doc.replaceAll('0.5.1', '0.5.0') }))).rejects.toThrow('repack required')
  })
  it('rejects a stale packed manifest', async () => {
    await expect(verifyReleaseCandidate(await fixture({ packedManifest: { ...manifest, version: '0.5.0-beta.2' } }))).rejects.toThrow('Packed manifest differs')
  })
  it('detects stale runtime even if its build marker filename matches', async () => {
    await expect(verifyReleaseCandidate(await fixture({ packedRuntime: 'export const tested = false\n' }))).rejects.toThrow('Packed payload differs')
  })
  it('rejects missing runtime members even when a matching marker is still present', async () => {
    await expect(verifyReleaseCandidate(await fixture({ omitRuntime: true }))).rejects.toThrow('file inventory differs')
  })
  it('rejects stale relay entrypoints outside lib', async () => {
    await expect(verifyReleaseCandidate(await fixture({ packedRelay: '// old relay\n' }))).rejects.toThrow('Packed payload differs')
  })
  it('rejects unpublished wording, wrong repositories and old release download links', () => {
    for (const text of [doc + 'unpublished local candidate', doc + '候选版，尚未发布', doc.replace('szymonsheng2045', 'different-owner'), doc + doc.replaceAll('0.5.1', '0.5.0')]) {
      expect(() => checkReleaseReadme(text, manifest, peerId, 'fixture')).toThrow()
    }
  })
  it('rejects missing or conflicting new entrypoint identities', () => {
    expect(() => checkReleaseReadme(doc.replaceAll(peerId, 'placeholder'), manifest, peerId, 'fixture')).toThrow('missing verified')
    expect(() => checkReleaseReadme(doc + doc.replaceAll(peerId, 'placeholder'), manifest, peerId, 'fixture')).toThrow('conflicting')
  })
})
