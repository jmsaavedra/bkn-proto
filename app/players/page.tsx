import { Suspense } from 'react'
import { PlayerList } from '@/components/players/PlayerList'
import { PlayerFilters } from '@/components/players/PlayerFilters'
import { Card, CardContent } from '@/components/ui/card'

interface Props {
  searchParams: { [key: string]: string | string[] | undefined }
}

export default function PlayersPage({ searchParams }: Props) {
  const searchQuery = typeof searchParams.q === 'string' ? searchParams.q : undefined
  const positionFilter = typeof searchParams.position === 'string' ? searchParams.position : undefined
  const teamFilter = typeof searchParams.team === 'string' ? searchParams.team : undefined

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Players</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Browse NBA players and view their stats
        </p>
      </div>

      <Suspense fallback={null}>
        <PlayerFilters />
      </Suspense>

      <Suspense fallback={<PlayerListSkeleton />}>
        <PlayerList search={searchQuery} position={positionFilter} team={teamFilter} />
      </Suspense>
    </div>
  )
}

function PlayerListSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-5 w-32 bg-muted rounded animate-pulse" />
      <div className="grid gap-3 md:grid-cols-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="animate-pulse space-y-3">
                <div className="flex justify-between">
                  <div className="h-5 w-32 bg-muted rounded" />
                  <div className="h-5 w-12 bg-muted rounded" />
                </div>
                <div className="h-4 w-24 bg-muted rounded" />
                <div className="flex gap-4">
                  <div className="h-4 w-16 bg-muted rounded" />
                  <div className="h-4 w-16 bg-muted rounded" />
                  <div className="h-4 w-16 bg-muted rounded" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
