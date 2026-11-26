// Fails when an agent instruction file is over its size limit (AGENTS.md → "Keep instruction files
// short"): 6 KiB at the root, 4 KiB per app. Every agent loads these on every task, so a rule that
// doesn't fit belongs in a doc the file links to. Run by the pre-commit hook (lefthook.yml) when one
// is staged; it measures the staged content, which is what gets committed.
import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'

const LIMITS = [
  ['AGENTS.md', 6 * 1024],
  ...readdirSync('src').map(app => [`src/${app}/AGENTS.md`, 4 * 1024]),
]

const over = []
for (const [path, limit] of LIMITS) {
  if (!existsSync(path)) continue
  let bytes
  try {
    bytes = execFileSync('git', ['show', `:${path}`]).length
  }
  catch {
    continue // not tracked yet
  }
  if (bytes > limit) over.push(`${path}: ${bytes} bytes, limit ${limit}`)
}

if (over.length) {
  console.error(`Instruction files over their limit:\n${over.join('\n')}\n\nMove detail into a linked doc (docs/README.md says which doc owns which rule).`)
  process.exit(1)
}
