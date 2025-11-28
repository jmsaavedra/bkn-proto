import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'

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
    imageUrl?: string
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
    contract?: {
      totalValue: number
      endSeason: string
      years: number
      type: string
    } | null
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
          <div className="flex items-start gap-3">
            {/* Player Headshot */}
            <div className="relative w-14 h-14 md:w-16 md:h-16 flex-shrink-0 rounded-full overflow-hidden bg-muted">
              {player.imageUrl ? (
                <Image
                  src={player.imageUrl}
                  alt={player.name.full}
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 768px) 56px, 64px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xl font-bold">
                  {player.name.first[0]}{player.name.last[0]}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-base md:text-lg truncate">{player.name.full}</h3>
                <Badge variant="outline" className="text-xs flex-shrink-0">
                  {player.position}
                </Badge>
              </div>

              <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground mb-2">
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
                <div className="flex gap-3 md:gap-4 text-xs md:text-sm">
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

              {player.contract && (
                <div className="flex gap-3 md:gap-4 text-xs md:text-sm mt-1 pt-1 border-t border-white/10">
                  <div>
                    <span className="text-muted-foreground">Contract:</span>{' '}
                    <span className="font-medium text-green-400">{formatCurrency(player.contract.totalValue)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Expires:</span>{' '}
                    <span className="font-medium">{player.contract.endSeason}</span>
                  </div>
                </div>
              )}

              {/* Status badges - mobile: below info, desktop: hidden here */}
              <div className="flex gap-1 mt-2 md:hidden">
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

            {/* Status badges - desktop: right column */}
            <div className="hidden md:flex flex-col items-end gap-1 flex-shrink-0">
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
