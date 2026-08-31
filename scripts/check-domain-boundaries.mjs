import { readFile, readdir } from 'node:fs/promises'
import { extname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
const forbiddenA2aHost = 'a2a-crucible.xyz'
const runtimeRoots = ['src', 'deploy']
const runtimeFiles = ['package.json', 'Dockerfile.relay', 'docker-compose.relay.yml', 'cordis.patch.yml']
const textExtensions = new Set(['.cjs', '.env', '.example', '.js', '.json', '.mjs', '.sh', '.ts', '.tsx', '.xml', '.yml', '.yaml'])

async function collect(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) files.push(...await collect(path))
    else if (entry.isFile() && textExtensions.has(extname(entry.name))) files.push(path)
  }
  return files
}

const files = [
  ...runtimeFiles.map(file => resolve(root, file)),
  ...(await Promise.all(runtimeRoots.map(directory => collect(resolve(root, directory))))).flat(),
]

const violations = []
for (const file of files) {
  const content = await readFile(file, 'utf8')
  if (content.includes(forbiddenA2aHost)) violations.push(relative(root, file))
}

if (violations.length > 0) {
  console.error(`Carbon Club runtime/deploy files must not depend on the A2A domain:\n${violations.map(file => `- ${file}`).join('\n')}`)
  process.exitCode = 1
} else {
  console.log(JSON.stringify({ event: 'carbon-club.domain-boundaries.ok', checkedFiles: files.length }))
}
