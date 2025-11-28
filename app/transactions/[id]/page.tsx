import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import connectDB from '@/lib/mongodb'
import Transaction from '@/lib/models/Transaction'
import Team from '@/lib/models/Team'
import Player from '@/lib/models/Player'
import { formatCurrency, formatDate, getScoreColor, getTransactionBadgeVariant, formatTransactionType } from '@/lib/utils'

// Ensure models are registered for populate
void Team;
void Player;

interface Props {
  params: { id: string }
}

async function getTransaction(id: string) {
  console.log('[TransactionDetail] Looking up transaction:', id)
  try {
    await connectDB()
    const transaction = await Transaction.findById(id)
      .populate('players')
      .populate('teams.teamId')
      .lean()
    console.log('[TransactionDetail] Found:', transaction ? 'yes' : 'no')
    return transaction
  } catch (error) {
    console.error('[TransactionDetail] Error:', error)
    return null
  }
}

export default async function TransactionDetailPage({ params }: Props) {
  const transaction = await getTransaction(params.id)

  if (!transaction) {
    notFound()
  }

  const typeBadgeVariant = getTransactionBadgeVariant(transaction.type as string)

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Back Button */}
      <Link href="/transactions">
        <Button variant="ghost" size="sm" className="h-9 px-2 md:px-3">
          <ArrowLeft className="mr-1 md:mr-2 h-4 w-4" />
          <span className="hidden md:inline">Back to Transactions</span>
          <span className="md:hidden">Back</span>
        </Button>
      </Link>

      {/* Header - Mobile Optimized */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 md:gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 md:gap-3 mb-2 flex-wrap">
            <Badge variant={typeBadgeVariant} className="text-xs md:text-sm">
              {formatTransactionType(transaction.type as string)}
            </Badge>
            <span className="text-xs md:text-sm text-muted-foreground">
              {formatDate(transaction.date)}
            </span>
          </div>
          <h1 className="text-xl md:text-3xl font-bold leading-tight">
            {transaction.details?.headline || 'Transaction Details'}
          </h1>
          {transaction.details?.description && (
            <p className="text-sm md:text-base text-muted-foreground mt-2 max-w-2xl">
              {transaction.details.description}
            </p>
          )}
        </div>
        {transaction.evaluation?.compositeScore !== undefined && (
          <div className="flex items-center gap-3 md:block md:text-right bg-white/5 rounded-lg p-3 md:p-0 md:bg-transparent">
            <div className="text-xs md:text-sm text-muted-foreground">Composite Score</div>
            <div className={`text-3xl md:text-4xl font-bold ${getScoreColor(transaction.evaluation.compositeScore)}`}>
              {Math.round(transaction.evaluation.compositeScore)}
            </div>
          </div>
        )}
      </div>

      {/* Asset Exchange */}
      {transaction.teams && transaction.teams.length > 0 && (
        <Card>
          <CardHeader className="p-4 md:p-6 pb-2 md:pb-4">
            <CardTitle className="text-base md:text-lg">Asset Exchange</CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
              {transaction.teams.map((team: any, index: number) => (
                <div key={index} className="border border-white/10 rounded-lg p-3 md:p-4">
                  <h3 className="font-semibold text-base md:text-lg mb-2 md:mb-3">
                    {team.teamId?.fullName || team.teamId?.name || 'Team'}
                  </h3>

                  {team.assetsIn && team.assetsIn.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs md:text-sm text-muted-foreground mb-1">Receives:</div>
                      <ul className="space-y-1">
                        {team.assetsIn.map((asset: any, i: number) => (
                          <li key={i} className="text-xs md:text-sm">
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

                  <div className="pt-2 md:pt-3 border-t border-white/10 text-xs md:text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Salary In:</span>
                      <span>{formatCurrency(team.salaryIn || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Salary Out:</span>
                      <span>{formatCurrency(team.salaryOut || 0)}</span>
                    </div>
                    <div className="flex justify-between font-semibold pt-1">
                      <span>Net Cap Impact:</span>
                      <span className={team.netCapImpact >= 0 ? 'text-green-500' : 'text-red-500'}>
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
          <CardHeader className="p-4 md:p-6 pb-2 md:pb-4">
            <CardTitle className="text-base md:text-lg">Evaluation Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
            {/* Mobile: 2 column grid, Desktop: 5 column grid */}
            <div className="grid grid-cols-2 gap-2 md:grid-cols-5 md:gap-4">
              <div className="text-center p-3 md:p-4 bg-muted rounded-lg">
                <div className="text-[10px] md:text-sm text-muted-foreground mb-1">Surplus Value</div>
                <div className={`text-lg md:text-2xl font-bold ${transaction.evaluation.surplusValue >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {transaction.evaluation.surplusValue >= 0 ? '+' : ''}{formatCurrency(transaction.evaluation.surplusValue || 0)}
                </div>
              </div>
              <div className="text-center p-3 md:p-4 bg-muted rounded-lg">
                <div className="text-[10px] md:text-sm text-muted-foreground mb-1">Win-Now</div>
                <div className={`text-lg md:text-2xl font-bold ${getScoreColor(transaction.evaluation.winNowScore || 0)}`}>
                  {transaction.evaluation.winNowScore || 0}
                </div>
              </div>
              <div className="text-center p-3 md:p-4 bg-muted rounded-lg">
                <div className="text-[10px] md:text-sm text-muted-foreground mb-1">Rebuild</div>
                <div className={`text-lg md:text-2xl font-bold ${getScoreColor(transaction.evaluation.rebuildScore || 0)}`}>
                  {transaction.evaluation.rebuildScore || 0}
                </div>
              </div>
              <div className="text-center p-3 md:p-4 bg-muted rounded-lg">
                <div className="text-[10px] md:text-sm text-muted-foreground mb-1">Cap Flex</div>
                <div className={`text-lg md:text-2xl font-bold ${(transaction.evaluation.capFlexibilityImpact || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {(transaction.evaluation.capFlexibilityImpact || 0) >= 0 ? '+' : ''}{formatCurrency(transaction.evaluation.capFlexibilityImpact || 0)}
                </div>
              </div>
              <div className="text-center p-3 md:p-4 bg-muted rounded-lg col-span-2 md:col-span-1">
                <div className="text-[10px] md:text-sm text-muted-foreground mb-1">Risk</div>
                <div className={`text-lg md:text-2xl font-bold ${getScoreColor(100 - (transaction.evaluation.riskScore || 0))}`}>
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
          <CardHeader className="p-4 md:p-6 pb-2 md:pb-4">
            <CardTitle className="text-base md:text-lg">Similar Transactions</CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
            <div className="space-y-2 md:space-y-3">
              {transaction.evaluation.historicalComparisons.map((comp: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-2 md:p-3 bg-muted rounded-lg gap-2">
                  <span className="text-xs md:text-sm line-clamp-1 flex-1">
                    {comp.transactionId?.details?.headline || 'Similar Transaction'}
                  </span>
                  <Badge variant="outline" className="text-[10px] md:text-xs flex-shrink-0">
                    {Math.round((comp.similarityScore || 0) * 100)}% Match
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Source */}
      {transaction.details?.source && (
        <div className="text-xs md:text-sm text-muted-foreground px-1">
          Source: {transaction.details.source}
          {transaction.details.sourceUrl && (
            <a
              href={transaction.details.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 underline hover:text-white transition-colors"
            >
              View Original
            </a>
          )}
        </div>
      )}
    </div>
  )
}
