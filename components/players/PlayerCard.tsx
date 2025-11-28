import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface PlayerCardProps {
  player: {
    _id: string
    name: {
      full: string
      first: string
      last: string
    }
    position: string
    age: number
    currentTeamId?: {
      abbreviation: string
      fullName: string
    }
    status: string
    draft?: {
      year: number | null
      round: number | null
      pick: number | null
      undrafted: boolean
    }
    trajectory?: {
      careerArc: string
      seasonStats?: Array<{
        season: string
        ppg: number
        rpg: number
        apg: number
      }>
    }
  }
}

function formatHeight(inches: number): string {
  const feet = Math.floor(inches / 12)
  const remainingInches = inches % 12
  return `${feet}'${remainingInches}"`
}

export function PlayerCard({ player }: PlayerCardProps) {
  const latestStats = player.trajectory?.seasonStats?.[player.trajectory.seasonStats.length - 1]

  const statusBadgeVariant = {
    active: 'default',
    inactive: 'secondary',
    retired: 'outline',
    gleague: 'secondary',
  }[player.status] as 'default' | 'secondary' | 'outline'

  const arcBadgeVariant = {
    ascending: 'default',
    peak: 'default',
    declining: 'secondary',
    unknown: 'outline',
  }[player.trajectory?.careerArc || 'unknown'] as 'default' | 'secondary' | 'outline'

  return (
    <Link href={`/players/${player._id}`}>
      <Card className="hover:bg-white/5 transition-colors cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-lg truncate">{player.name.full}</h3>
                <Badge variant="outline" className="text-xs flex-shrink-0">
                  {player.position}
                </Badge>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                {player.currentTeamId ? (
                  <span>{player.currentTeamId.abbreviation}</span>
                ) : (
                  <span>Free Agent</span>
                )}
                <span>•</span>
                <span>{player.age} yrs</span>
                {player.draft && !player.draft.undrafted && player.draft.year && (
                  <>
                    <span>•</span>
                    <span>{player.draft.year} Draft</span>
                  </>
                )}
              </div>

              {latestStats && (
                <div className="flex gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">PPG:</span>{' '}
                    <span className="font-medium">{latestStats.ppg.toFixed(1)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">RPG:</span>{' '}
                    <span className="font-medium">{latestStats.rpg.toFixed(1)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">APG:</span>{' '}
                    <span className="font-medium">{latestStats.apg.toFixed(1)}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col items-end gap-1">
              <Badge variant={statusBadgeVariant} className="text-xs capitalize">
                {player.status}
              </Badge>
              {player.trajectory?.careerArc && player.trajectory.careerArc !== 'unknown' && (
                <Badge variant={arcBadgeVariant} className="text-xs capitalize">
                  {player.trajectory.careerArc}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
