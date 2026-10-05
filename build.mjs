// dsh-commit build
import { build } from 'esbuild'
import { cpSync, mkdirSync } from 'node:fs'

mkdirSync('dist', { recursive: true })
await build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  outfile: 'dist/index.js',
  external: ['@deepseek-ai/*', 'zod', 'node:*'],
  sourcemap: false,
  logLevel: 'info',
})
cpSync('cordis.patch.yml', 'dist/cordis.patch.yml')
console.log('built dist/index.js')
