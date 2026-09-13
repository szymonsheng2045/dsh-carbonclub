import assert from 'node:assert/strict'
import { access, readFile, readdir } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const manifest = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'))

function exportedFiles(value) {
  if (typeof value === 'string') return [value]
  if (value === null || typeof value !== 'object') return []
  return Object.values(value).flatMap(exportedFiles)
}

const declared = new Set([
  manifest.main,
  manifest.types,
  ...exportedFiles(manifest.exports),
].filter(value => typeof value === 'string' && value.startsWith('./')))

for (const file of declared) await access(resolve(root, file))
await import(`${resolve(root, 'lib/relay-runtime.js')}?package-export-check=${Date.now()}`)
const buildMarkers = (await readdir(resolve(root, 'lib'))).filter(name => /^build-[a-f0-9]{64}\.marker$/.test(name))
assert.equal(buildMarkers.length, 1, 'the package must contain exactly one content-addressed build marker')
for (const required of ['./lib/client.js', './lib/typert.host.js', './lib/typert.remote-client.js', './lib/index.d.ts']) {
  assert.ok(declared.has(required) || required === './lib/index.d.ts', `${required} must be declared or required by the package entrypoints`)
  await access(resolve(root, required))
}

assert.equal(manifest.private, false, 'public beta package must not be marked private')
assert.ok(!manifest.files.some(value => /^(docs\/?|docs\/\*.*)$/.test(value)), 'public docs must use an explicit allowlist, not the entire internal documentation directory')
assert.ok(!manifest.files.some(value => /HANDOFF|QA-|\.DS_Store/i.test(value)), 'internal handoff and QA files must not be distributed')
for (const readme of ['README.md', 'README.zh.md']) {
  const text = await readFile(resolve(root, readme), 'utf8')
  for (const match of text.matchAll(/\]\(\.\/(docs\/[^)#]+)(?:#[^)]*)?\)/g)) {
    assert.ok(manifest.files.includes(match[1]), `${readme} links to an unpackaged document: ${match[1]}`)
    await access(resolve(root, match[1]))
  }
}
// The release number and the hall protocol move independently: a release that changes
// nothing on the wire must not strand the previous lobby. The manifest declares the
// protocol it speaks and this gate holds that declaration to the shipped constant, so a
// declaration that drifts from the code still fails the build.
const protocolSource = await readFile(resolve(root, 'src/network/protocol.ts'), 'utf8')
const protocolVersion = protocolSource.match(/HALL_PROTOCOL_VERSION = '([^']+)'/)?.[1]
assert.ok(protocolVersion, 'cannot read HALL_PROTOCOL_VERSION from src/network/protocol.ts')
assert.equal(manifest.hallProtocol, protocolVersion, 'declared hallProtocol must match HALL_PROTOCOL_VERSION')
for (const required of ['README.md', 'LICENSE', 'SECURITY.md', 'docs/PROTOCOL.md', 'docs/PUBLIC-BETA-CHECKLIST.md', 'docs/OPERATING-A-RELAY.md', 'docs/CAPACITY-500.md', 'docs/INFRASTRUCTURE-BOUNDARIES.md', 'scripts/community-relay.mjs', 'scripts/check-domain-boundaries.mjs', 'Dockerfile.relay', 'docker-compose.relay.yml', 'pnpm-lock.yaml', 'pnpm-lock.deploy.yaml', 'pnpm-workspace.yaml']) await access(resolve(root, required))
assert.equal(
  await readFile(resolve(root, 'pnpm-lock.deploy.yaml'), 'utf8'),
  await readFile(resolve(root, 'pnpm-lock.yaml'), 'utf8'),
  'the npm-publishable relay lockfile must match pnpm-lock.yaml',
)
assert.ok(!manifest.files.some(value => /(?:^|\/)dev(?:\/|$)|credentials|storages|sessions/i.test(value)), 'package files must exclude local DSH state')
for (const [name, version] of Object.entries(manifest.dependencies)) {
  if (name === 'libp2p' || name.startsWith('@libp2p/') || name.startsWith('@chainsafe/libp2p-')) assert.match(version, /^\d+\.\d+\.\d+$/, `${name} must be exactly pinned during the beta`)
}

console.log(JSON.stringify({ ok: true, version: manifest.version, checked: [...declared].sort(), packageFiles: manifest.files }, null, 2))
