// 双版本中继并存验证：生产 0.5.0 固定代码与本地 0.5.1 候选同机同时运行。
// 证明迁移方案的并存前提：两套中继各自独立（端口、密钥、PeerID、topic），
// 两版大厅消息互不串扰。全程回环，不触碰生产进程、配置或公网入口。
import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import { copyFile, mkdtemp, rm, stat, symlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { setTimeout as delay } from 'node:timers/promises'

const root = fileURLToPath(new URL('..', import.meta.url))
const usage = 'Usage: node scripts/p2p-dual-version-coexistence.mjs --archive <trusted-0.5.0.tgz> --old-runtime <installed-0.5.0-directory>\nExecutes trusted local code with disposable loopback identities; never downloads or deploys.'
export function parseArgs(args) {
  if (args.length === 1 && args[0] === '--help') return null
  const options = {}
  for (let i = 0; i < args.length; i += 2) {
    const name = args[i]
    assert.ok(['--archive', '--old-runtime'].includes(name) && args[i + 1] && !args[i + 1].startsWith('--') && !options[name], usage)
    options[name] = resolve(args[i + 1])
  }
  assert.ok(options['--archive'] && options['--old-runtime'], usage)
  return options
}

export function validateArchiveListing(names, details) {
  const paths = names.replace(/\n$/, '').split('\n')
  assert.ok(paths.length > 0 && paths.length < 10_000, 'unsafe archive entry count')
  const seen = new Set()
  for (const path of paths) {
    assert.ok(path.startsWith('package/') && !path.includes('\\') && !/[\x00-\x1f\x7f]/.test(path), 'unsafe archive path')
    const parts = path.replace(/\/$/, '').split('/')
    assert.ok(parts.every(part => part && part !== '..' && part !== '.' && part !== 'node_modules'), 'unsafe archive path')
    assert.ok(!seen.has(path), 'duplicate archive entry')
    seen.add(path)
  }
  const entries = details.trimEnd().split('\n')
  assert.equal(entries.length, paths.length, 'ambiguous archive listing')
  assert.ok(entries.every(line => line[0] === '-' || line[0] === 'd'), 'archive links and special entries are forbidden')
  assert.ok(seen.has('package/lib/index.js'), 'archive is missing package/lib/index.js')
}

function tar(args) {
  const result = spawnSync('tar', args, { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, timeout: 30_000 })
  assert.equal(result.status, 0, `tar failed: ${result.error?.message ?? result.stderr}`)
  return result.stdout
}

export async function stopRelay(state) {
  if (!state || state.child.exitCode !== null || state.child.signalCode !== null || !state.child.pid) return
  const child = state.child
  await new Promise((resolve, reject) => {
    let escalation
    let deadline
    const finish = error => {
      clearTimeout(escalation)
      clearTimeout(deadline)
      child.removeListener('exit', onExit)
      error ? reject(error) : resolve()
    }
    const onExit = () => finish()
    child.once('exit', onExit)
    child.kill('SIGTERM')
    escalation = setTimeout(() => child.kill('SIGKILL'), 3_000)
    deadline = setTimeout(() => finish(Error('relay did not exit after SIGKILL')), 8_000)
  })
}

function startRelay(scriptDir, keyFile) {
  const child = spawn(process.execPath, ['scripts/community-relay.mjs'], {
    cwd: scriptDir,
    env: { ...process.env, CARBON_RELAY_KEY_FILE: keyFile, CARBON_RELAY_LISTEN: '/ip4/127.0.0.1/tcp/0/ws', CARBON_RELAY_ANNOUNCE: '', CARBON_RELAY_REVIEW_PORT: '0', CARBON_RELAY_REVIEW_TOKEN_FILE: '' },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  const state = { child, output: '', errors: '', address: undefined, peerId: undefined }
  child.on('error', error => { state.spawnError = error })
  child.stdout.on('data', chunk => { state.output = (state.output + chunk).slice(-1024 * 1024) })
  child.stderr.on('data', chunk => { state.errors = (state.errors + chunk).slice(-64 * 1024) })
  return state
}

async function waitFor(check, label, ...relays) {
  const deadline = Date.now() + 20_000
  while (Date.now() < deadline) {
    if (check()) return
    for (const relay of relays) if (relay && (relay.spawnError || relay.child.exitCode !== null || relay.child.signalCode !== null)) throw Error(`Relay exited during ${label}: ${relay.spawnError ?? relay.errors}`)
    await delay(100)
  }
  throw Error(`Timeout: ${label}`)
}

async function relayReady(state, label) {
  await waitFor(() => {
    const line = state.output.split('\n').find(line => line.includes('carbon-relay.ready'))
    if (!line) return false
    try {
      const parsed = JSON.parse(line)
      state.address = parsed.addresses[0]
      state.peerId = parsed.peerId
      return Boolean(state.address && state.peerId)
    } catch { return false }
  }, label, state)
}

export async function hallRoundTrip(NodeClass, relayAddress, label) {
  const { generateKeyPair } = await import('@libp2p/crypto/keys')
  const options = { enableMdns: false, enableRelayReservations: false, bootstrapAddresses: [relayAddress], listenAddresses: ['/ip4/127.0.0.1/tcp/0/ws'] }
  const observer = new NodeClass(await generateKeyPair('Ed25519'), options)
  const guest = new NodeClass(await generateKeyPair('Ed25519'), options)
  try {
    await observer.start()
    await guest.start()
    await waitFor(() => observer.status().connectedPeers > 0 && guest.status().connectedPeers > 0, `${label} connected`)
    await guest.joinHall({ name: `${label}-guest` })
    await observer.joinHall({ name: `${label}-observer` })
    const message = await guest.publishHallMessage({ body: `${label} hall message stays on its own protocol.` })
    await waitFor(() => observer.roomSnapshot().messages.some(item => item.id === message.id), `${label} delivery`)
    return { observer, guest, message }
  } catch (error) {
    await Promise.allSettled([observer.stop(), guest.stop()])
    throw error
  }
}

export async function main(args = process.argv.slice(2)) {
const options = parseArgs(args)
if (!options) { console.log(usage); return }
const archive = options['--archive']
const oldRuntime = options['--old-runtime']
const archiveStat = await stat(archive)
assert.ok(archiveStat.isFile() && archiveStat.size < 200 * 1024 * 1024, 'archive must be a local file smaller than 200 MiB')
assert.ok((await stat(join(oldRuntime, 'scripts/community-relay.mjs'))).isFile(), 'missing old relay entrypoint')
assert.ok((await stat(join(oldRuntime, 'node_modules'))).isDirectory(), 'old runtime dependencies are not installed')
const directory = await mkdtemp(join(tmpdir(), 'carbon-dual-version-'))
let oldRelay
let newRelay
let oldHall
let newHall
try {
  // Inspect the same private snapshot we extract; no archive links may escape it.
  const snapshot = join(directory, 'trusted-old.tgz')
  await copyFile(archive, snapshot)
  validateArchiveListing(tar(['-tzf', snapshot]), tar(['-tvzf', snapshot]))
  tar(['-xzf', snapshot, '-C', directory])
  await symlink(join(root, 'node_modules'), join(directory, 'package/node_modules'), 'dir')
  const { CarbonClubNode: OldNode, HALL_TOPIC } = await import(pathToFileURL(join(directory, 'package/lib/index.js')).href)
  assert.ok(HALL_TOPIC.endsWith('/0.5.0'), 'expected archived 0.5.0 protocol')
  const { CarbonClubNode: NewNode } = await import('../lib/index.js')
  oldRelay = startRelay(oldRuntime, join(directory, 'relay-050.key'))
  newRelay = startRelay(root, join(directory, 'relay-051.key'))
  await relayReady(oldRelay, 'old relay ready')
  await relayReady(newRelay, 'new relay ready')
  assert.notEqual(oldRelay.peerId, newRelay.peerId, 'relays must have distinct identities')

  oldHall = await hallRoundTrip(OldNode, oldRelay.address, 'old-0.5.0')
  newHall = await hallRoundTrip(NewNode, newRelay.address, 'new-0.5.1')

  // 双向隔离：各自大厅只见自己的消息。
  assert.ok(!oldHall.observer.roomSnapshot().messages.some(item => item.id === newHall.message.id), 'new message leaked into old hall')
  assert.ok(!newHall.observer.roomSnapshot().messages.some(item => item.id === oldHall.message.id), 'old message leaked into new hall')

  // 跨版本邀请仍被拒绝（并存不意味着互通）。
  await assert.rejects(newHall.guest.connect((await oldHall.guest.createInvite()).code), /HALL_PROTOCOL_MISMATCH/)
  await assert.rejects(oldHall.guest.connect((await newHall.guest.createInvite()).code), /Invalid Carbon Club invite|HALL_PROTOCOL_MISMATCH/)

  assert.ok(oldRelay.child.exitCode === null && newRelay.child.exitCode === null, 'both relays must still be running')
  console.log(JSON.stringify({ ok: true, oldPeerId: oldRelay.peerId, newPeerId: newRelay.peerId, oldDelivery: true, newDelivery: true, crossInviteRejected: true, messageIsolation: true, simultaneous: true, scope: 'loopback dual-version relay coexistence; not WAN/production' }))
} finally {
  const clientsStopped = await Promise.allSettled([oldHall?.observer.stop(), oldHall?.guest.stop(), newHall?.observer.stop(), newHall?.guest.stop()])
  // rm does not follow the dependency symlink; only this mkdtemp directory is owned.
  const stopped = [...clientsStopped, ...await Promise.allSettled([stopRelay(oldRelay), stopRelay(newRelay)])]
  if (stopped.every(result => result.status === 'fulfilled')) await rm(directory, { recursive: true, force: true })
  else throw new AggregateError(stopped.filter(result => result.status === 'rejected').map(result => result.reason), `Relay cleanup failed; retained ${directory}`)
}
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await main()
}
