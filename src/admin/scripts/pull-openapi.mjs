// Downloads the API's OpenAPI spec into openapi/syncra.json.
// Run with `pnpm --filter admin api:pull`; it reads NUXT_PUBLIC_API_URL from .env.
import { writeFile } from 'node:fs/promises'

const apiURL = process.env.NUXT_PUBLIC_API_URL
if (!apiURL) {
  console.error('NUXT_PUBLIC_API_URL is not set. Add it to src/admin/.env (see .env.example).')
  process.exit(1)
}

const specURL = `${apiURL.replace(/\/$/, '')}/v3/api-docs`
const res = await fetch(specURL)
if (!res.ok) {
  console.error(`Could not download ${specURL}: ${res.status} ${res.statusText}`)
  process.exit(1)
}

const spec = await res.json()
// Pretty-printed so spec changes show up as a readable diff.
await writeFile(new URL('../openapi/syncra.json', import.meta.url), `${JSON.stringify(spec, null, 2)}\n`)
console.log(`Saved ${specURL} to openapi/syncra.json`)
