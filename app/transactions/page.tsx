import { Suspense } from 'react'
import { TransactionList } from '@/components/transactions/TransactionList'
import { TransactionFilters } from '@/components/transactions/TransactionFilters'
import { SeasonSelector } from '@/components/SeasonSelector'
import { Card, CardContent } from '@/components/ui/card'

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function TransactionsPage({ searchParams }: Props) {
  const params = await searchParams
  const typeFilter = typeof params.type === 'string' ? params.type : undefined
  const searchQuery = typeof params.q === 'string' ? params.q : undefined
  const season = typeof params.season === 'string' ? params.season : '2024-25'

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Transactions</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Browse and filter NBA transactions
          <span className="hidden md:inline"> for the {season} season</span>
        </p>
        {/* Mobile Season Selector */}
        <div className="mt-3 flex items-center gap-2 md:hidden">
          <span className="text-sm text-muted-foreground">Season</span>
          <Suspense fallback={null}>
            <SeasonSelector />
          </Suspense>
        </div>
      </div>

      <Suspense fallback={null}>
        <TransactionFilters />
      </Suspense>

      <Suspense fallback={<TransactionListSkeleton />}>
        <TransactionList type={typeFilter} search={searchQuery} season={season} />
      </Suspense>
    </div>
  )
}

function TransactionListSkeleton() {
  return (
    <div className="space-y-3 md:space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <Card key={i}>
          <CardContent className="p-4 md:p-6">
            <div className="animate-pulse space-y-3">
              <div className="flex justify-between">
                <div className="h-4 w-20 md:w-24 bg-muted rounded" />
                <div className="h-4 w-12 md:w-16 bg-muted rounded" />
              </div>
              <div className="h-5 md:h-6 w-40 md:w-48 bg-muted rounded" />
              <div className="h-4 w-full bg-muted rounded hidden md:block" />
              <div className="flex gap-2">
                <div className="h-5 md:h-6 w-16 md:w-20 bg-muted rounded" />
                <div className="h-5 md:h-6 w-16 md:w-20 bg-muted rounded" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
