import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const root = resolve(import.meta.dirname, '..')
const manifest = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'))
assert.match(manifest.version, /^0\.5\.1-beta\.\d+$/)
const output = resolve(root, 'artifacts', `candidate-${manifest.version}`)
await mkdir(output, { recursive: true })
function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8' })
  if (result.status !== 0) throw Error(`${command}: ${result.stderr || result.stdout}`)
  return result.stdout
}
// Never package stale lib/ merely because an old build marker exists.
run(process.execPath, ['node_modules/typescript/bin/tsc', '--noEmit'])
run(process.execPath, ['node_modules/tsdown/dist/run.mjs'])
run(process.execPath, ['scripts/write-build-marker.mjs'])
run(process.execPath, ['scripts/verify-package-exports.mjs'])
// This produces a local artifact only. It neither publishes nor runs prepack.
const [packed] = JSON.parse(run('npm', ['pack', '--ignore-scripts', '--json', '--pack-destination', output]))
assert.equal(packed.version, manifest.version)
assert.ok(packed.files.length > 0)
const packedPaths = new Set(packed.files.map(file => file.path))
for (const required of manifest.files.filter(file => file.startsWith('docs/'))) {
  assert.ok(packedPaths.has(required), `Required public document missing from archive: ${required}`)
}
for (const file of packed.files) {
  assert.ok(!file.path.split('/').includes('..'))
  assert.ok(!/(^|\/)(HANDOFF[^/]*|QA-[^/]*|\.DS_Store)$/i.test(file.path), `Internal material in package: ${file.path}`)
  assert.ok(!/(^|\/)(\.git|\.env|node_modules|dev|marketing|artifacts|sessions|storages|\.credentials[^/]*)(\/|$)/i.test(file.path), `Unexpected package data: ${file.path}`)
}
const archive = resolve(output, packed.filename)
const sha256 = createHash('sha256').update(await readFile(archive)).digest('hex')
await writeFile(resolve(output, 'SHA256SUMS'), `${sha256}  ${packed.filename}\n`)
await writeFile(resolve(output, 'package-inventory.json'), JSON.stringify({
  status: 'local-unpublished-candidate', version: manifest.version, sha256,
  sourceCommit: run('git', ['rev-parse', 'HEAD']).trim(), workingTreeMayBeDirty: true,
  buildMarkers: packed.files.filter(file => /build-[a-f0-9]{64}\.marker$/.test(file.path)).map(file => file.path),
  files: packed.files,
}, null, 2) + '\n')
console.log(JSON.stringify({ ok: true, archive, sha256, files: packed.files.length, published: false }))
