import { copyFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const dist = 'dist'
const index = join(dist, 'index.html')

if (!existsSync(index)) {
  console.error('postbuild: dist/index.html not found — run npm run build first')
  process.exit(1)
}

copyFileSync(index, join(dist, '404.html'))
console.log('postbuild: copied index.html → 404.html (GitHub Pages SPA)')
