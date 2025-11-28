import connectDB from '@/lib/mongodb'
import Player from '@/lib/models/Player'
import Team from '@/lib/models/Team'
import { PlayerCard } from './PlayerCard'
import { Card, CardContent } from '@/components/ui/card'

// Ensure Team model is registered for populate
void Team;

interface PlayerListProps {
  search?: string
  position?: string
  team?: string
}

async function getPlayers(search?: string, position?: string, team?: string) {
  try {
    await connectDB()

    // Build query based on filters
    const query: Record<string, unknown> = {}

    // Search filter (searches name)
    if (search) {
      query.$or = [
        { 'name.full': { $regex: search, $options: 'i' } },
        { 'name.first': { $regex: search, $options: 'i' } },
        { 'name.last': { $regex: search, $options: 'i' } },
      ]
    }

    // Position filter - escape special regex characters (like hyphen in G-F)
    if (position) {
      const escapedPosition = position.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&')
      query.position = { $regex: escapedPosition, $options: 'i' }
    }

    // Team filter
    if (team) {
      query.currentTeamId = team
    }

    const players = await Player.find(query)
      .sort({ 'name.last': 1, 'name.first': 1 })
      .limit(100)
      .populate('currentTeamId')
      .lean()

    return players
  } catch (error) {
    console.error('[PlayerList] Error fetching players:', error)
    return []
  }
}

export async function PlayerList({ search, position, team }: PlayerListProps) {
  const players = await getPlayers(search, position, team)

  if (players.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <p className="text-lg font-medium">No players found</p>
          {search || position ? (
            <p className="text-sm mt-2">
              Try adjusting your search or filters.
            </p>
          ) : (
            <p className="text-sm mt-2">
              Run the seeding scripts to populate the database with player data.
            </p>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Showing {players.length} players
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        {players.map((player: any) => (
          <PlayerCard
            key={player._id.toString()}
            player={{
              ...player,
              _id: player._id.toString(),
            }}
          />
        ))}
      </div>
    </div>
  )
}
