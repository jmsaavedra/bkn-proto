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
}

async function getTransactions(type?: string, search?: string) {
  console.log('[TransactionList] getTransactions called', { type, search })
  try {
    console.log('[TransactionList] Connecting to MongoDB...')
    await connectDB()
    console.log('[TransactionList] Connected, querying transactions...')

    // Build query based on filters
    const query: Record<string, unknown> = {}

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

    const transactions = await Transaction.find(query)
      .sort({ date: -1 })
      .limit(100)
      .populate('teams.teamId')
      .lean()

    console.log('[TransactionList] Query complete, found:', transactions.length, 'transactions')
    return transactions
  } catch (error) {
    console.error('[TransactionList] Error fetching transactions:', error)
    return []
  }
}

export async function TransactionList({ type, search }: TransactionListProps) {
  const transactions = await getTransactions(type, search)

  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <p className="text-lg font-medium">No transactions found</p>
          <p className="text-sm mt-2">
            Run the seeding scripts to populate the database with transaction data.
          </p>
          <pre className="mt-4 p-4 bg-muted rounded-lg text-left text-xs overflow-auto max-w-lg mx-auto">
{`cd scripts/
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

python seed_teams.py
python seed_salary_cap.py
python seed_players.py
python seed_contracts.py
python seed_transactions.py
python calculate_evaluations.py`}
          </pre>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Showing {transactions.length} transactions
      </p>
      {transactions.map((transaction: any) => (
        <TransactionCard
          key={transaction._id.toString()}
          transaction={{
            ...transaction,
            _id: transaction._id.toString(),
          }}
        />
      ))}
    </div>
  )
}
