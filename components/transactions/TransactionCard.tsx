import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowRight, ChevronRight } from 'lucide-react'
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
    <Link href={`/transactions/${transaction._id}`} className="block touch-active">
      <Card className={`${getTransactionTypeClass(transaction.type)} hover:border-white/30 transition-all`}>
        <CardContent className="p-4 md:p-6">
          {/* Mobile Layout */}
          <div className="md:hidden">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={typeBadgeVariant} className="text-[10px] px-2 py-0.5">
                  {transaction.type}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatDate(transaction.date)}
                </span>
              </div>
              {transaction.evaluation?.compositeScore !== undefined && (
                <div className={`text-xl font-bold ${getScoreColor(transaction.evaluation.compositeScore)}`}>
                  {Math.round(transaction.evaluation.compositeScore)}
                </div>
              )}
            </div>

            <h3 className="text-base font-semibold mb-1 line-clamp-2">
              {transaction.details?.headline || 'Transaction'}
            </h3>

            {teamAbbrs && (
              <p className="text-xs text-muted-foreground mb-2">
                {teamAbbrs}
              </p>
            )}

            {/* Compact metrics row */}
            {transaction.evaluation && (
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
                {transaction.evaluation.winNowScore !== undefined && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 flex-shrink-0">
                    Win: {transaction.evaluation.winNowScore}
                  </Badge>
                )}
                {transaction.evaluation.surplusValue !== undefined && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 flex-shrink-0">
                    {transaction.evaluation.surplusValue >= 0 ? '+' : ''}{formatCurrency(transaction.evaluation.surplusValue)}
                  </Badge>
                )}
              </div>
            )}

            {/* Mobile tap indicator */}
            <div className="flex items-center justify-end mt-2 text-xs text-muted-foreground">
              <span>View details</span>
              <ChevronRight className="h-4 w-4" />
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden md:block">
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

            <Button variant="outline" size="sm">
              View Details
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
