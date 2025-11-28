import connectDB from '@/lib/mongodb'
import Transaction from '@/lib/models/Transaction'
import { TransactionCard } from './TransactionCard'
import { Card, CardContent } from '@/components/ui/card'

async function getTransactions() {
  try {
    await connectDB()
    const transactions = await Transaction.find({})
      .sort({ date: -1 })
      .limit(50)
      .populate('teams.teamId')
      .lean()
    return transactions
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return []
  }
}

export async function TransactionList() {
  const transactions = await getTransactions()

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
