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
assert.match(manifest.version, /^0\.5\.0-beta\./, 'public beta package version must identify protocol milestone 0.5')
for (const required of ['README.md', 'LICENSE', 'SECURITY.md', 'docs/PROTOCOL.md', 'docs/PUBLIC-BETA-CHECKLIST.md', 'docs/OPERATING-A-RELAY.md', 'docs/CAPACITY-500.md', 'scripts/community-relay.mjs', 'Dockerfile.relay', 'docker-compose.relay.yml', 'pnpm-lock.yaml', 'pnpm-lock.deploy.yaml', 'pnpm-workspace.yaml']) await access(resolve(root, required))
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
