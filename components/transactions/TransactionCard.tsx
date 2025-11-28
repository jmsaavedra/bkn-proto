import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { formatCurrency, formatDate, getScoreColor, getTransactionTypeClass } from '@/lib/utils'

interface TransactionCardProps {
  transaction: {
    _id: string
    type: string
    date: string | Date
    season?: string
    details?: {
      headline?: string
      description?: string
    }
    teams?: Array<{
      teamId?: {
        abbreviation?: string
        fullName?: string
      }
      salaryIn?: number
      salaryOut?: number
      netCapImpact?: number
    }>
    evaluation?: {
      compositeScore?: number
      surplusValue?: number
      winNowScore?: number
      capFlexibilityImpact?: number
    }
  }
}

export function TransactionCard({ transaction }: TransactionCardProps) {
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
  }[transaction.type] as 'trade' | 'signing' | 'waiver' | 'extension' | 'buyout' || 'default'

  const teamAbbrs = transaction.teams
    ?.map(t => t.teamId?.abbreviation)
    .filter(Boolean)
    .join(' ↔ ') || ''

  return (
    <Card className={getTransactionTypeClass(transaction.type)}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-3">
            <Badge variant={typeBadgeVariant}>
              {transaction.type}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {formatDate(transaction.date)}
            </span>
            {teamAbbrs && (
              <span className="text-sm font-medium">
                {teamAbbrs}
              </span>
            )}
          </div>
          {transaction.evaluation?.compositeScore !== undefined && (
            <div className="text-right">
              <span className="text-xs text-muted-foreground">Score</span>
              <div className={`text-2xl font-bold ${getScoreColor(transaction.evaluation.compositeScore)}`}>
                {Math.round(transaction.evaluation.compositeScore)}
              </div>
            </div>
          )}
        </div>

        <h3 className="text-lg font-semibold mb-2">
          {transaction.details?.headline || 'Transaction'}
        </h3>

        {transaction.details?.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {transaction.details.description}
          </p>
        )}

        {/* Quick Metrics */}
        {transaction.evaluation && (
          <div className="flex flex-wrap gap-2 mb-4">
            {transaction.evaluation.winNowScore !== undefined && (
              <Badge variant="outline">
                Win-Now: {transaction.evaluation.winNowScore}
              </Badge>
            )}
            {transaction.evaluation.surplusValue !== undefined && (
              <Badge variant="outline">
                Surplus: {transaction.evaluation.surplusValue >= 0 ? '+' : ''}{formatCurrency(transaction.evaluation.surplusValue)}
              </Badge>
            )}
            {transaction.evaluation.capFlexibilityImpact !== undefined && (
              <Badge variant="outline">
                Cap: {transaction.evaluation.capFlexibilityImpact >= 0 ? '+' : ''}{formatCurrency(transaction.evaluation.capFlexibilityImpact)}
              </Badge>
            )}
          </div>
        )}

        <Link href={`/transactions/${transaction._id}`}>
          <Button variant="outline" size="sm">
            View Details
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
