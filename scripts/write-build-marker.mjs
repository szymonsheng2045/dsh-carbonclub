import { createHash } from 'node:crypto'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { resolve, relative } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const output = resolve(root, 'lib')

async function filesBelow(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const path = resolve(directory, entry.name)
    if (entry.isDirectory()) files.push(...await filesBelow(path))
    else if (!/^build-[a-f0-9]{64}\.marker$/.test(entry.name)) files.push(path)
  }
  return files
}

const hash = createHash('sha256')
for (const file of (await filesBelow(output)).sort()) {
  hash.update(relative(output, file))
  hash.update(await readFile(file))
}
const digest = hash.digest('hex')
await writeFile(resolve(output, `build-${digest}.marker`), `${digest}\n`)
