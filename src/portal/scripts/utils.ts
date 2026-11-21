import { fileURLToPath } from 'node:url'

export const appPath = fileURLToPath(new URL('../app', import.meta.url))
