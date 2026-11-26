// Fails when a relative Markdown link points at a file that doesn't exist, or at a `#heading` that
// file doesn't have. Agents follow these links to find the rules, so a broken one hides a rule.
// Run by the pre-commit hook (lefthook.yml) when a .md file is staged; run it by hand after
// moving or renaming a doc: `node scripts/check-doc-links.mjs`.
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join, normalize, relative } from 'node:path'

const SKIP = new Set(['node_modules', '.git', '.nuxt', '.output', '.data', '.cache', 'dist', 'test-results', 'playwright-report'])

function markdownFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (SKIP.has(entry.name)) return []
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return markdownFiles(path)
    return entry.name.endsWith('.md') ? [path] : []
  })
}

/** The text outside fenced code blocks, where links and headings are real. */
const prose = file => readFileSync(file, 'utf8').replace(/```[\s\S]*?```/g, '')

/** A heading's anchor as GitHub and GitLab make it: lowercase, punctuation dropped, spaces to hyphens. */
const slug = heading => heading.trim().toLowerCase()
  .replace(/<[^>]+>/g, '')
  .replace(/[`*]/g, '')
  .replace(/[^\p{L}\p{N}\s_-]/gu, '')
  .replace(/\s/g, '-')

const anchorCache = new Map()
function anchorsOf(file) {
  if (!anchorCache.has(file)) {
    const seen = new Map()
    const anchors = new Set()
    for (const [, heading] of prose(file).matchAll(/^#{1,6}\s+(.+?)\s*#*$/gm)) {
      const base = slug(heading)
      const count = seen.get(base) ?? 0
      anchors.add(count ? `${base}-${count}` : base)
      seen.set(base, count + 1)
    }
    anchorCache.set(file, anchors)
  }
  return anchorCache.get(file)
}

const broken = []
for (const file of markdownFiles('.')) {
  for (const [, link] of prose(file).matchAll(/\]\(([^)\s]+)\)/g)) {
    if (/^[a-z][a-z+.-]*:/i.test(link)) continue // https:, mailto:, …
    const [path, anchor] = link.split('#')
    const target = path ? normalize(join(dirname(file), decodeURIComponent(path))) : file
    if (!existsSync(target)) broken.push(`${relative('.', file)} → ${link}: no such file`)
    else if (anchor && target.endsWith('.md') && !anchorsOf(target).has(anchor)) broken.push(`${relative('.', file)} → ${link}: no such heading`)
  }
}

if (broken.length) {
  console.error(`Broken links in the docs:\n${broken.join('\n')}`)
  process.exit(1)
}
