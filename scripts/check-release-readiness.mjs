// Read-only artifact gate. Passing this is not publication/production approval.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { readFile, stat, lstat, readdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { peerIdFromString } from '@libp2p/peer-id'

const repository = 'https://github.com/szymonsheng2045/dsh-carbonclub'
const readmes = ['README.md', 'README.zh.md']

export function checkReleaseReadme(text, manifest, peerId, label) {
  const expectedUrl = `${repository}/releases/download/v${manifest.version}/${manifest.name}-${manifest.version}.tgz`
  const urls = text.match(/https:\/\/github\.com\/[^\s)"'<>]+\/releases\/download\/[^\s)"'<>]+/g) ?? []
  assert.ok(urls.includes(expectedUrl), `${label}: missing exact release download URL`)
  for (const url of urls) assert.equal(url, expectedUrl, `${label}: unexpected release download URL`)
  assert.ok(!/unpublished local candidate|候选版，尚未发布/i.test(text), `${label}: unpublished wording remains`)
  const bootstrap = `/dns4/relay-051.laozi.art/tcp/443/wss/p2p/${peerId}`
  assert.ok(text.includes(bootstrap), `${label}: missing verified new bootstrap PeerID`)
  const newAddresses = text.match(/\/dns4\/relay-051\.laozi\.art\/tcp\/443\/wss\/p2p\/[^\s'"`<>]+/g) ?? []
  for (const address of newAddresses) assert.equal(address, bootstrap, `${label}: conflicting new bootstrap PeerID`)
}

function tar(archive, args, maxBuffer = 1024 * 1024) {
  const result = spawnSync('tar', [args[0], '-f', archive, ...args.slice(1)], {
    encoding: 'utf8', maxBuffer, timeout: 15_000,
  })
  assert.equal(result.status, 0, `Cannot inspect candidate archive: ${result.error?.message ?? result.stderr}`)
  return result.stdout
}

export async function verifyReleaseCandidate({ root, archive, sha256, peerId }) {
  assert.ok(archive, 'Pass --archive with the exact final tgz; workspace-only checks are insufficient')
  assert.match(sha256 ?? '', /^[a-f0-9]{64}$/, 'Pass --sha256 with the approved final archive digest')
  assert.ok(peerId, 'Pass --peer-id with the measured production candidate identity')
  peerIdFromString(peerId) // Reject placeholders; does not establish external trust.
  const path = resolve(archive)
  const info = await stat(path)
  assert.ok(info.isFile() && info.size <= 32 * 1024 * 1024, 'Expected a regular archive no larger than 32 MiB')
  const digest = createHash('sha256').update(await readFile(path)).digest('hex')
  assert.equal(digest, sha256, 'Archive SHA-256 mismatch')
  const manifest = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'))
  assert.equal(manifest.name, 'dsh-human-buffer')
  assert.match(manifest.version, /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/)
  const members = tar(path, ['-tz']).trim().split('\n')
  assert.ok(members.length <= 1000, 'Archive member limit exceeded')
  assert.equal(new Set(members).size, members.length, 'Duplicate archive members')
  for (const member of members) {
    assert.ok(member.startsWith('package/') && !member.includes('\\') &&
      !member.split('/').some(part => part === '..' || part === '.'), 'Unsafe archive member')
  }
  function fromArchive(name) {
    const member = `package/${name}`
    assert.ok(members.includes(member), `Missing archive member: ${name}`)
    // Stream only the named file to stdout: never unpack into the working tree.
    return tar(path, ['-xzO', member])
  }
  assert.deepEqual(JSON.parse(fromArchive('package.json')), manifest, 'Packed manifest differs from workspace')
  for (const name of readmes) {
    const local = await readFile(resolve(root, name), 'utf8')
    const packed = fromArchive(name)
    assert.equal(packed, local, `${name}: packed documentation differs from workspace; repack required`)
    checkReleaseReadme(packed, manifest, peerId, `archive/${name}`)
  }
  // Derive required files from the workspace allowlist, not from what an archive
  // happens to contain: missing entrypoints must fail just like stale entrypoints.
  const required = new Set(['package.json', ...readmes])
  async function include(name) {
    assert.ok(!name.startsWith('/') && !name.includes('\\') &&
      name.split('/').every(part => part && part !== '.' && part !== '..'), 'Unsafe package allowlist path')
    const info = await lstat(resolve(root, name))
    if (info.isDirectory()) {
      for (const child of await readdir(resolve(root, name))) await include(`${name}/${child}`)
    } else {
      assert.ok(info.isFile(), `Package allowlist must contain only regular files: ${name}`)
      required.add(name)
    }
  }
  assert.ok(Array.isArray(manifest.files) && manifest.files.includes('lib'), 'Missing explicit package allowlist')
  for (const name of manifest.files) await include(name)
  const packedFiles = members.filter(member => !member.endsWith('/')).map(member => member.slice('package/'.length))
  assert.deepEqual([...packedFiles].sort(), [...required].sort(), 'Packed file inventory differs from workspace allowlist')
  assert.ok(packedFiles.some(name => /^lib\/build-[a-f0-9]{64}\.marker$/.test(name)), 'Missing build marker')
  // Byte-match all public payloads, including relay entrypoints and helpers.
  for (const name of required) {
    const member = `package/${name}`
    const packed = spawnSync('tar', ['-xzO', '-f', path, member], { maxBuffer: 16 * 1024 * 1024, timeout: 15_000 })
    assert.equal(packed.status, 0, `Cannot read runtime member: ${name}`)
    assert.ok(packed.stdout.equals(await readFile(resolve(root, name))), `Packed payload differs from workspace: ${name}`)
  }
  assert.equal(createHash('sha256').update(await readFile(path)).digest('hex'), digest, 'Archive changed during inspection')
  return { ok: true, sha256: digest, version: manifest.version, peerId,
    scope: 'exact archive, documentation, bootstrap and allowlisted payload alignment; not public reachability, security audit or publication approval' }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const { values } = parseArgs({ options: {
      archive: { type: 'string' }, sha256: { type: 'string' }, 'peer-id': { type: 'string' }, help: { type: 'boolean' },
    } })
    if (values.help) {
      console.log('node scripts/check-release-readiness.mjs --archive /absolute/final.tgz --sha256 <64 hex> --peer-id <measured new relay ID>\nRead-only. Does not publish, deploy or replace external review gates.')
    } else {
      console.log(JSON.stringify(await verifyReleaseCandidate({ root: resolve(import.meta.dirname, '..'),
        archive: values.archive, sha256: values.sha256, peerId: values['peer-id'] })))
    }
  } catch (error) {
    console.error(`Release gate blocked: ${error.message}`)
    process.exitCode = 1
  }
}
