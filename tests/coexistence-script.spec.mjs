import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import { once } from 'node:events'
import { mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'vitest'
import { fileURLToPath } from 'node:url'
import { hallRoundTrip, parseArgs, stopRelay, validateArchiveListing } from '../scripts/p2p-dual-version-coexistence.mjs'

const script = fileURLToPath(new URL('../scripts/p2p-dual-version-coexistence.mjs', import.meta.url))
test('requires explicit archive and runtime; rejects unknown and duplicate options', () => {
  for (const args of [[], ['--archive', 'old.tgz'], ['--wat', 'x'], ['--archive', 'a', '--archive', 'b', '--old-runtime', 'r']]) assert.throws(() => parseArgs(args))
  assert.equal(parseArgs(['--help']), null)
  assert.ok(parseArgs(['--archive', 'old.tgz', '--old-runtime', 'runtime'])['--archive'].endsWith('/old.tgz'))
})
test('CLI help works without creating nodes; missing files fail before startup', () => {
  assert.equal(spawnSync(process.execPath, [script, '--help']).status, 0)
  const failed = spawnSync(process.execPath, [script, '--archive', '/nonexistent-carbon-test/archive', '--old-runtime', '/nonexistent-carbon-test/runtime'], { encoding: 'utf8' })
  assert.notEqual(failed.status, 0)
  assert.match(failed.stderr, /ENOENT/)
  assert.doesNotMatch(failed.stdout, /carbon-relay.ready/)
})
test('accepts regular npm archive entries', () => {
  validateArchiveListing('package/\npackage/lib/index.js\n', 'drwxr-xr-x metadata\n-rw-r--r-- metadata\n')
})
test('rejects traversal, absolute, dependency, duplicate and special archive paths', () => {
  for (const path of ['../escape', '/package/escape', 'package/../escape', 'package/./escape', 'package//escape', 'package/node_modules/x', 'package/a\\b', 'package/a\r', 'package/lib/index.js']) {
    assert.throws(() => validateArchiveListing(`package/lib/index.js\n${path}\n`, '-rw-r--r-- entry\n-rw-r--r-- entry\n'))
  }
  for (const type of ['l', 'h', 'b', 'c', 'p', 's']) assert.throws(() => validateArchiveListing('package/lib/index.js\n', `${type} metadata\n`))
})
test('failed observer or guest startup stops both instances', async () => {
  for (const failureIndex of [0, 1]) {
    const instances = []
    class FakeNode {
      constructor() { this.index = instances.length; instances.push(this) }
      async start() { if (this.index === failureIndex) throw Error('startup failed') }
      async stop() { this.stopped = true }
    }
    await assert.rejects(hallRoundTrip(FakeNode, '/unused', 'test'), /startup failed/)
    assert.equal(instances.length, 2)
    assert.ok(instances.every(node => node.stopped))
  }
})
test('relay shutdown waits for process exit and can be repeated', async () => {
  const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { stdio: 'ignore' })
  await once(child, 'spawn')
  await stopRelay({ child })
  assert.ok(child.exitCode !== null || child.signalCode !== null)
  await stopRelay({ child })
  await stopRelay(undefined)
})
test('rejects real symlink archive before extraction and cleans private snapshot only', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'carbon-coexistence-unit-'))
  try {
    const sandbox = join(directory, 'scratch')
    const source = join(directory, 'source')
    const runtime = join(directory, 'runtime')
    await mkdir(sandbox)
    await mkdir(join(source, 'package/lib'), { recursive: true })
    await mkdir(join(runtime, 'scripts'), { recursive: true })
    await mkdir(join(runtime, 'node_modules'))
    await writeFile(join(runtime, 'scripts/community-relay.mjs'), 'throw Error("must not execute")')
    const sentinel = join(directory, 'external-sentinel')
    await writeFile(sentinel, 'preserve')
    await symlink(sentinel, join(source, 'package/lib/index.js'))
    const archive = join(directory, 'unsafe.tgz')
    assert.equal(spawnSync('tar', ['-czf', archive, '-C', source, 'package']).status, 0)
    const result = spawnSync(process.execPath, [script, '--archive', archive, '--old-runtime', runtime], { encoding: 'utf8', env: { ...process.env, TMPDIR: sandbox, TMP: sandbox, TEMP: sandbox } })
    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /links and special entries are forbidden/)
    assert.equal(await readFile(sentinel, 'utf8'), 'preserve')
    assert.deepEqual(await readdir(sandbox), [])
  } finally { await rm(directory, { recursive: true, force: true }) }
})
