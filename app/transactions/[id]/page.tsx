import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import connectDB from '@/lib/mongodb'
import Transaction from '@/lib/models/Transaction'
import { formatCurrency, formatDate, getScoreColor } from '@/lib/utils'

interface Props {
  params: { id: string }
}

async function getTransaction(id: string) {
  try {
    await connectDB()
    const transaction = await Transaction.findById(id)
      .populate('players')
      .populate('teams.teamId')
      .lean()
    return transaction
  } catch {
    return null
  }
}

export default async function TransactionDetailPage({ params }: Props) {
  const transaction = await getTransaction(params.id)

  if (!transaction) {
    notFound()
  }

  const typeBadgeVariant = {
    TRADE: 'trade',
    SIGNING: 'signing',
    WAIVER: 'waiver',
    EXTENSION: 'extension',
    BUYOUT: 'buyout',
    TWO_WAY: 'signing',
    TEN_DAY: 'signing',
    DRAFT_PICK: 'trade',
    SIGN_AND_TRADE: 'trade',
  }[transaction.type as string] as 'trade' | 'signing' | 'waiver' | 'extension' | 'buyout' || 'default'

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link href="/transactions">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Transactions
        </Button>
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Badge variant={typeBadgeVariant}>
              {transaction.type}
            </Badge>
            <span className="text-muted-foreground">
              {formatDate(transaction.date)}
            </span>
          </div>
          <h1 className="text-3xl font-bold">
            {transaction.details?.headline || 'Transaction Details'}
          </h1>
          {transaction.details?.description && (
            <p className="text-muted-foreground mt-2 max-w-2xl">
              {transaction.details.description}
            </p>
          )}
        </div>
        {transaction.evaluation?.compositeScore !== undefined && (
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Composite Score</div>
            <div className={`text-4xl font-bold ${getScoreColor(transaction.evaluation.compositeScore)}`}>
              {Math.round(transaction.evaluation.compositeScore)}
            </div>
          </div>
        )}
      </div>

      {/* Asset Exchange */}
      {transaction.teams && transaction.teams.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Asset Exchange</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {transaction.teams.map((team: any, index: number) => (
                <div key={index} className="border rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-3">
                    {team.teamId?.fullName || team.teamId?.name || 'Team'}
                  </h3>

                  {team.assetsIn && team.assetsIn.length > 0 && (
                    <div className="mb-3">
                      <div className="text-sm text-muted-foreground mb-1">Receives:</div>
                      <ul className="space-y-1">
                        {team.assetsIn.map((asset: any, i: number) => (
                          <li key={i} className="text-sm">
                            {asset.type === 'player' && '👤 '}
                            {asset.type === 'pick' && '🎯 '}
                            {asset.type === 'cash' && '💵 '}
                            {asset.playerId?.name?.full ||
                             (asset.pickDetails && `${asset.pickDetails.year} ${asset.pickDetails.round === 1 ? '1st' : '2nd'} Round Pick`) ||
                             (asset.cashAmount && formatCurrency(asset.cashAmount))}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="pt-3 border-t text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Salary In:</span>
                      <span>{formatCurrency(team.salaryIn || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Salary Out:</span>
                      <span>{formatCurrency(team.salaryOut || 0)}</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span>Net Cap Impact:</span>
                      <span className={team.netCapImpact >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {team.netCapImpact >= 0 ? '+' : ''}{formatCurrency(team.netCapImpact || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Evaluation Breakdown */}
      {transaction.evaluation && (
        <Card>
          <CardHeader>
            <CardTitle>Evaluation Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground">Surplus Value</div>
                <div className={`text-2xl font-bold ${transaction.evaluation.surplusValue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {transaction.evaluation.surplusValue >= 0 ? '+' : ''}{formatCurrency(transaction.evaluation.surplusValue || 0)}
                </div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground">Win-Now</div>
                <div className={`text-2xl font-bold ${getScoreColor(transaction.evaluation.winNowScore || 0)}`}>
                  {transaction.evaluation.winNowScore || 0}
                </div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground">Rebuild</div>
                <div className={`text-2xl font-bold ${getScoreColor(transaction.evaluation.rebuildScore || 0)}`}>
                  {transaction.evaluation.rebuildScore || 0}
                </div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground">Cap Flex</div>
                <div className={`text-2xl font-bold ${(transaction.evaluation.capFlexibilityImpact || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {(transaction.evaluation.capFlexibilityImpact || 0) >= 0 ? '+' : ''}{formatCurrency(transaction.evaluation.capFlexibilityImpact || 0)}
                </div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground">Risk</div>
                <div className={`text-2xl font-bold ${getScoreColor(100 - (transaction.evaluation.riskScore || 0))}`}>
                  {transaction.evaluation.riskScore || 0}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Similar Transactions */}
      {transaction.evaluation?.historicalComparisons && transaction.evaluation.historicalComparisons.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Similar Historical Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {transaction.evaluation.historicalComparisons.map((comp: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span>{comp.transactionId?.details?.headline || 'Similar Transaction'}</span>
                  <Badge variant="outline">
                    {Math.round((comp.similarityScore || 0) * 100)}% Similar
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Source */}
      {transaction.details?.source && (
        <div className="text-sm text-muted-foreground">
          Source: {transaction.details.source}
          {transaction.details.sourceUrl && (
            <a href={transaction.details.sourceUrl} target="_blank" rel="noopener noreferrer" className="ml-2 underline">
              View Original
            </a>
          )}
        </div>
      )}
    </div>
  )
}
