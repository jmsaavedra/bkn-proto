import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export default function TransactionsLoading() {
  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Transactions</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Browse and filter NBA transactions
        </p>
      </div>

      {/* Filter skeleton */}
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-8 w-20 bg-muted rounded-full animate-pulse" />
        ))}
      </div>

      {/* Loading spinner */}
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>

      {/* Transaction skeletons */}
      <div className="space-y-3 md:space-y-4">
        {[1, 2, 3].map((i) => (
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
    </div>
  )
}
