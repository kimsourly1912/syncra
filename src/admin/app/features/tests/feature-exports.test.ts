import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

// A feature's index.ts exports only what code outside the feature imports (decision 0015): its
// screens, and the building blocks other features use. An export nobody outside imports widens
// what others may depend on, so it fails here. Inside a feature, tests import files directly.

const admin = fileURLToPath(new URL('../../../', import.meta.url))
const featuresDir = join(admin, 'app', 'features')

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return name === 'generated' ? [] : sourceFiles(path)
    return /\.(ts|vue)$/.test(name) ? [path] : []
  })
}

const features = readdirSync(featuresDir).filter(name => statSync(join(featuresDir, name)).isDirectory() && name !== 'tests')

/** The names an index.ts exports: `export { a, b as C }` and `export type { D }`. */
function exportsOf(feature: string) {
  const index = readFileSync(join(featuresDir, feature, 'index.ts'), 'utf8')
  return [...index.matchAll(/export (?:type )?\{([^}]+)\}/g)].flatMap(match => match[1]!.split(','))
    .map(part => part.trim().split(/\s+as\s+/).pop()!)
    .filter(Boolean)
}

/** Every name imported from `@/features/<feature>` by code outside that feature. */
function importsFromOutside(feature: string) {
  const names = new Set<string>()
  const files = [...sourceFiles(join(admin, 'app')), ...sourceFiles(join(admin, 'test'))]
    .filter(file => !relative(featuresDir, file).startsWith(`${feature}${sep}`))
  const pattern = new RegExp(`import (?:type )?\\{([^}]+)\\} from '@/features/${feature}'`, 'g')
  for (const file of files) {
    for (const match of readFileSync(file, 'utf8').matchAll(pattern)) {
      for (const part of match[1]!.split(',')) names.add(part.trim().replace(/^type\s+/, '').split(/\s+as\s+/)[0]!)
    }
  }
  return names
}

describe('feature public APIs', () => {
  it.each(features)('%s exports only what code outside it imports', (feature) => {
    const used = importsFromOutside(feature)
    expect(exportsOf(feature).filter(name => !used.has(name))).toEqual([])
  })
})
