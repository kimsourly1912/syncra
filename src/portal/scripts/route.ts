import { appPath } from './utils'
import { join } from 'node:path'
import { writeFileSync, existsSync, readdirSync } from 'node:fs'

// interface RouteParts {
//   name: string
//   route?: string
//   isDynamic: boolean
//   type: 'file' | 'folder'
//   children: RouteParts[]
// }

const pagePage = join(appPath, 'pages')

function getRoutePaths(path: string) {
  if (!existsSync(path)) return []
  return readdirSync(path, { encoding: 'utf-8', recursive: true })
}

const content = getRoutePaths(pagePage)

writeFileSync('path.json', JSON.stringify(content), 'utf-8')
