import { readFile } from 'node:fs/promises'

const wrapper = await readFile(new URL('../deploy/macos/run-cloudflared.sh', import.meta.url), 'utf8')
const plist = await readFile(new URL('../deploy/macos/com.example.dsh-carbon-cloudflared.plist', import.meta.url), 'utf8')
const config = await readFile(new URL('../deploy/macos/cloudflared.example.yml', import.meta.url), 'utf8')

const requiredWrapperFragments = [
  'CARBON_TUNNEL_CONFIG_FILE is required',
  'tunnel config must be a regular, non-symlink file',
  'tunnel config permissions must be 600',
  'tunnel config directory must be owned by the service user with permissions 700',
  'tunnel config may contain only no-autoupdate: true',
  'tunnel \\\n  --config "$CONFIG_FILE" \\\n  --no-autoupdate',
  'run --token-file "$TOKEN_FILE"',
]

for (const fragment of requiredWrapperFragments) {
  if (!wrapper.includes(fragment)) {
    throw new Error(`macOS tunnel wrapper is missing required boundary: ${fragment}`)
  }
}

if (!plist.includes('<key>CARBON_TUNNEL_CONFIG_FILE</key>')) {
  throw new Error('LaunchAgent template does not declare CARBON_TUNNEL_CONFIG_FILE')
}

for (const forbidden of ['a2a-crucible.xyz', '.cloudflared/config.yml', 'credentials.json', '9091']) {
  if (wrapper.includes(forbidden) || plist.includes(forbidden) || config.includes(forbidden)) {
    throw new Error(`macOS Carbon Club tunnel assets reference forbidden boundary: ${forbidden}`)
  }
}

const effectiveConfig = config
  .split('\n')
  .map(line => line.replace(/#.*/, '').trim())
  .filter(Boolean)

if (effectiveConfig.length !== 1 || effectiveConfig[0] !== 'no-autoupdate: true') {
  throw new Error('dedicated cloudflared config must contain only no-autoupdate: true')
}

console.log(JSON.stringify({ event: 'carbon-club.macos-tunnel-boundaries.ok' }))
