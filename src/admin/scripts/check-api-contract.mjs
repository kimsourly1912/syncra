// Fails when app/api/generated isn't what `api:gen` makes from the committed spec
// (openapi/syncra.json): a hand edit, or a spec change without regenerating. Run by the
// pre-commit hook (lefthook.yml) when the spec, the generator, or the generated files change.
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const admin = fileURLToPath(new URL('..', import.meta.url))
const GENERATED = 'app/api/generated'

execSync('pnpm api:gen', { cwd: admin, stdio: 'ignore' })

// Compares the regenerated files with what's staged. Line endings don't count (Windows checkouts).
const changed = execSync(`git diff --ignore-cr-at-eol --name-only -- ${GENERATED}`, { cwd: admin, encoding: 'utf8' }).trim()

if (changed) {
  console.error(`${GENERATED} doesn't match the spec:\n${changed}\n\nRun \`pnpm --filter admin api:gen\`, check the result, and stage it.`)
  process.exit(1)
}
