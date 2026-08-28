import type { UserConfig } from 'tsdown'

const clientExternals = new Set([
  'react',
  'react/jsx-runtime',
  'react-dom',
  'react-dom/client',
  '@deepseek-ai/cordis',
  '@deepseek-ai/dsh-client-runtime/client',
  '@deepseek-ai/dsh-client-ui-slots',
])

const host: UserConfig = {
  name: 'dsh-human-buffer',
  entry: {
    index: 'src/index.ts',
    'typert.host': 'src/typert.host.ts',
    'typert.remote-client': 'src/typert.remote-client.ts',
    'relay-runtime': 'src/relay-runtime.ts',
  },
  outDir: 'lib',
  format: 'esm',
  fixedExtension: false,
  platform: 'node',
  target: 'node22',
  dts: true,
  clean: true,
  sourcemap: true,
  deps: {
    neverBundle: specifier => specifier.startsWith('@deepseek-ai/') || specifier.startsWith('@libp2p/') || specifier.startsWith('@chainsafe/') || specifier.startsWith('@multiformats/') || specifier === 'libp2p' || specifier === 'zod',
  },
}

const client: UserConfig = {
  name: 'dsh-human-buffer/client',
  entry: { client: 'src/client/index.ts' },
  outDir: 'lib',
  format: 'cjs',
  platform: 'browser',
  target: 'es2022',
  dts: false,
  clean: false,
  sourcemap: true,
  deps: {
    neverBundle: specifier => clientExternals.has(specifier),
    alwaysBundle: specifier => !clientExternals.has(specifier),
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  outputOptions: {
    entryFileNames: 'client.js',
    banner: 'window.__ModuleLoader__.load({ id: "dsh-human-buffer", factory: (require) => {',
    intro: 'var module = { exports: {} }; var exports = module.exports;',
    footer: 'return module.exports; } });',
  },
}

export default [host, client]
