import connectDB from '@/lib/mongodb'
import Transaction from '@/lib/models/Transaction'
import Team from '@/lib/models/Team' // Required for populate
import { TransactionCard } from './TransactionCard'
import { Card, CardContent } from '@/components/ui/card'

// Ensure Team model is registered for populate
void Team;

interface TransactionListProps {
  type?: string
  search?: string
  season?: string
}

// Helper to get date range for an NBA season (e.g., "2024-25" = Oct 2024 - Sep 2025)
function getSeasonDateRange(season: string) {
  const [startYear] = season.split('-').map(Number)
  const seasonStart = new Date(startYear, 9, 1) // October 1st
  const seasonEnd = new Date(startYear + 1, 8, 30) // September 30th
  return { seasonStart, seasonEnd }
}

const LIMIT = 50
const MOBILE_LIMIT = 25

async function getTransactions(type?: string, search?: string, season?: string) {
  try {
    await connectDB()

    // Build query based on filters
    const query: Record<string, unknown> = {}

    // Season filter (date range) - skip if "all" seasons selected
    if (season && season !== 'all') {
      const { seasonStart, seasonEnd } = getSeasonDateRange(season)
      query.date = { $gte: seasonStart, $lte: seasonEnd }
    }

    // Type filter (comma-separated list)
    if (type) {
      const types = type.split(',').filter(Boolean)
      if (types.length > 0) {
        query.type = { $in: types }
      }
    }

    // Search filter (searches headline and description)
    if (search) {
      query.$or = [
        { 'details.headline': { $regex: search, $options: 'i' } },
        { 'details.description': { $regex: search, $options: 'i' } },
      ]
    }

    // Run count and find in parallel
    const [transactions, totalCount] = await Promise.all([
      Transaction.find(query)
        .sort({ date: -1 })
        .limit(LIMIT)
        .populate('teams.teamId')
        .lean(),
      Transaction.countDocuments(query),
    ])

    return { transactions, totalCount }
  } catch (error) {
    console.error('[TransactionList] Error fetching transactions:', error)
    return { transactions: [], totalCount: 0 }
  }
}

export async function TransactionList({ type, search, season }: TransactionListProps) {
  const { transactions, totalCount } = await getTransactions(type, search, season)

  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <p className="text-lg font-medium">No transactions found</p>
          <p className="text-sm mt-2">
            Try adjusting your filters or selecting a different season.
          </p>
        </CardContent>
      </Card>
    )
  }

  const showingAllDesktop = transactions.length >= totalCount
  const mobileCount = Math.min(transactions.length, MOBILE_LIMIT)
  const showingAllMobile = mobileCount >= totalCount

  return (
    <div className="space-y-4">
      {/* Mobile count */}
      <p className="text-sm text-muted-foreground md:hidden">
        {showingAllMobile
          ? `Showing ${totalCount} transaction${totalCount === 1 ? '' : 's'}`
          : `Showing ${mobileCount} of ${totalCount} transactions`
        }
      </p>
      {/* Desktop count */}
      <p className="text-sm text-muted-foreground hidden md:block">
        {showingAllDesktop
          ? `Showing ${totalCount} transaction${totalCount === 1 ? '' : 's'}`
          : `Showing ${transactions.length} of ${totalCount} transactions`
        }
      </p>
      {transactions.map((transaction: any, index: number) => (
        <div
          key={transaction._id.toString()}
          className={index >= MOBILE_LIMIT ? 'hidden md:block' : ''}
        >
          <TransactionCard
            transaction={{
              ...transaction,
              _id: transaction._id.toString(),
            }}
          />
        </div>
      ))}
    </div>
  )
}
