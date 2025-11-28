import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import connectDB from '@/lib/mongodb'
import Player from '@/lib/models/Player'
import Team from '@/lib/models/Team'

// Ensure Team model is registered for populate
void Team;

interface Props {
  params: { id: string }
}

async function getPlayer(id: string) {
  try {
    await connectDB()
    const player = await Player.findById(id)
      .populate('currentTeamId')
      .lean()
    return player
  } catch (error) {
    console.error('[PlayerDetail] Error:', error)
    return null
  }
}

function formatHeight(inches: number): string {
  const feet = Math.floor(inches / 12)
  const remainingInches = inches % 12
  return `${feet}'${remainingInches}"`
}

export default async function PlayerDetailPage({ params }: Props) {
  const player = await getPlayer(params.id)

  if (!player) {
    notFound()
  }

  const statusBadgeVariant = {
    active: 'default',
    inactive: 'secondary',
    retired: 'outline',
    gleague: 'secondary',
  }[player.status as string] as 'default' | 'secondary' | 'outline'

  const arcBadgeVariant = {
    ascending: 'default',
    peak: 'default',
    declining: 'secondary',
    unknown: 'outline',
  }[player.trajectory?.careerArc || 'unknown'] as 'default' | 'secondary' | 'outline'

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Back Button */}
      <Link href="/players">
        <Button variant="ghost" size="sm" className="h-9 px-2 md:px-3">
          <ArrowLeft className="mr-1 md:mr-2 h-4 w-4" />
          <span className="hidden md:inline">Back to Players</span>
          <span className="md:hidden">Back</span>
        </Button>
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 md:gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 md:gap-3 mb-2 flex-wrap">
            <Badge variant="outline" className="text-xs md:text-sm">
              {player.position}
            </Badge>
            <Badge variant={statusBadgeVariant} className="text-xs md:text-sm capitalize">
              {player.status}
            </Badge>
            {player.trajectory?.careerArc && player.trajectory.careerArc !== 'unknown' && (
              <Badge variant={arcBadgeVariant} className="text-xs md:text-sm capitalize">
                {player.trajectory.careerArc}
              </Badge>
            )}
          </div>
          <h1 className="text-xl md:text-3xl font-bold leading-tight">
            {player.name.full}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            {(player.currentTeamId as any)?.fullName || 'Free Agent'}
          </p>
        </div>
      </div>

      {/* Bio Info */}
      <Card>
        <CardHeader className="p-4 md:p-6 pb-2 md:pb-4">
          <CardTitle className="text-base md:text-lg">Player Info</CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-xs md:text-sm text-muted-foreground">Age</div>
              <div className="text-lg font-semibold">{player.age}</div>
            </div>
            <div>
              <div className="text-xs md:text-sm text-muted-foreground">Height</div>
              <div className="text-lg font-semibold">{formatHeight(player.height)}</div>
            </div>
            <div>
              <div className="text-xs md:text-sm text-muted-foreground">Weight</div>
              <div className="text-lg font-semibold">{player.weight} lbs</div>
            </div>
            <div>
              <div className="text-xs md:text-sm text-muted-foreground">Country</div>
              <div className="text-lg font-semibold">{player.country}</div>
            </div>
          </div>

          {/* Draft Info */}
          {player.draft && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="text-xs md:text-sm text-muted-foreground mb-2">Draft</div>
              {player.draft.undrafted ? (
                <div className="text-sm">Undrafted</div>
              ) : (
                <div className="text-sm">
                  {player.draft.year} - Round {player.draft.round}, Pick {player.draft.pick}
                  {player.draft.team && <span className="text-muted-foreground"> ({player.draft.team})</span>}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Season Stats */}
      {player.trajectory?.seasonStats && player.trajectory.seasonStats.length > 0 && (
        <Card>
          <CardHeader className="p-4 md:p-6 pb-2 md:pb-4">
            <CardTitle className="text-base md:text-lg">Season Stats</CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Season</th>
                    <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Team</th>
                    <th className="text-right py-2 pr-4 font-medium text-muted-foreground">GP</th>
                    <th className="text-right py-2 pr-4 font-medium text-muted-foreground">MPG</th>
                    <th className="text-right py-2 pr-4 font-medium text-muted-foreground">PPG</th>
                    <th className="text-right py-2 pr-4 font-medium text-muted-foreground">RPG</th>
                    <th className="text-right py-2 pr-4 font-medium text-muted-foreground">APG</th>
                    <th className="text-right py-2 font-medium text-muted-foreground">PER</th>
                  </tr>
                </thead>
                <tbody>
                  {player.trajectory.seasonStats.map((stat: any, i: number) => (
                    <tr key={i} className="border-b border-white/5 last:border-0">
                      <td className="py-2 pr-4">{stat.season}</td>
                      <td className="py-2 pr-4">{stat.team}</td>
                      <td className="py-2 pr-4 text-right">{stat.gamesPlayed}</td>
                      <td className="py-2 pr-4 text-right">{stat.mpg.toFixed(1)}</td>
                      <td className="py-2 pr-4 text-right font-medium">{stat.ppg.toFixed(1)}</td>
                      <td className="py-2 pr-4 text-right">{stat.rpg.toFixed(1)}</td>
                      <td className="py-2 pr-4 text-right">{stat.apg.toFixed(1)}</td>
                      <td className="py-2 text-right">{stat.per.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Injury History */}
      {player.trajectory?.injuryHistory && player.trajectory.injuryHistory.length > 0 && (
        <Card>
          <CardHeader className="p-4 md:p-6 pb-2 md:pb-4">
            <CardTitle className="text-base md:text-lg">Injury History</CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
            <div className="space-y-2">
              {player.trajectory.injuryHistory.map((injury: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                  <div>
                    <span className="font-medium">{injury.type}</span>
                    <span className="text-muted-foreground text-sm ml-2">({injury.season})</span>
                  </div>
                  <Badge variant="secondary">{injury.gamesOut} games</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
