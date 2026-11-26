import { vi } from 'vitest'

interface RegisteredTool {
  name: string
  description: string
  inputSchema: Record<string, unknown>
  annotations: Record<string, boolean>
  execute: (input: unknown) => Promise<{ content: { type: 'text', text: string }[], isError?: boolean }>
}

/**
 * A fake WebMCP `navigator.modelContext`, standing in for a browser that supports WebMCP, so tests
 * see the tools a screen registers and call them the way an agent does (through Nuxt's registry,
 * with its input validation and results). happy-dom has no WebMCP.
 *
 * @example
 * const modelContext = installModelContext()
 * beforeAll(() => modelContext.install())
 * afterAll(() => modelContext.uninstall())
 * await modelContext.registered('search_leads')
 * const { text, isError } = await modelContext.call('search_leads', { search: 'acme' })
 */
export function installModelContext() {
  const tools = new Map<string, RegisteredTool>()
  const fake = {
    registerTool(tool: RegisteredTool, { signal }: { signal: AbortSignal }) {
      tools.set(tool.name, tool)
      signal.addEventListener('abort', () => tools.delete(tool.name))
    },
  }

  const tool = (name: string) => {
    const found = tools.get(name)
    if (!found) throw new Error(`No tool "${name}" is registered (registered: ${[...tools.keys()].join(', ') || 'none'}).`)
    return found
  }

  return {
    install: () => Object.defineProperty(navigator, 'modelContext', { value: fake, configurable: true }),
    uninstall: () => Reflect.deleteProperty(navigator, 'modelContext'),
    tool,
    /** Registration is batched to the next task, so wait for it. */
    registered: (name: string) => vi.waitFor(() => tool(name)),
    unregistered: (name: string) => vi.waitFor(() => {
      if (tools.has(name)) throw new Error(`"${name}" is still registered.`)
    }),
    /** Calls a tool as an agent would, and returns its text. */
    async call(name: string, input: unknown = {}) {
      const result = await tool(name).execute(input)
      return { text: result.content.map(part => part.text).join('\n'), isError: result.isError }
    },
  }
}
