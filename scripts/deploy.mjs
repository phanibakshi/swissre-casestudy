import { spawnSync } from 'node:child_process'

const git = spawnSync('git', ['--version'], { encoding: 'utf8' })

if (git.error || git.status !== 0) {
  console.error(`
npm run deploy needs Git installed (gh-pages pushes to the gh-pages branch).

Your machine does not have Git in PATH. Use GitHub Actions instead:

  1. Push this repo to GitHub
  2. Settings → Pages → Source: "GitHub Actions"
  3. Push to main — the workflow in .github/workflows/deploy.yml deploys automatically

Or install Git: https://git-scm.com/download/win
`)
  process.exit(1)
}

const result = spawnSync('npx', ['gh-pages', '-d', 'dist'], {
  stdio: 'inherit',
  shell: true,
})

process.exit(result.status ?? 1)
