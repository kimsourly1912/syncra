import type { BalanceDto, TransactionDto } from '@/types/dto/token'

type Endpoint = 'companies' | 'tokens' | 'transactions' | 'balance'

const build = buildEndpoint<Endpoint>('companies')

export function getBalanceTokens(id: number) {
  const endpoint = build(id, 'tokens', 'balance')
  return useAPI<BalanceDto.Response>(endpoint, { method: 'GET' })
}

export function getTokenTransactions(id: number, query?: Partial<TransactionDto.Query>) {
  const endpoint = build(id, 'tokens', 'transactions')
  return useAPI<TransactionDto.Response>(endpoint, { method: 'GET', query })
}
