import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`
  }
  return `$${amount.toFixed(0)}`
}

export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function getScoreColor(score: number): string {
  if (score >= 80) return 'score-excellent'
  if (score >= 60) return 'score-good'
  if (score >= 40) return 'score-average'
  return 'score-poor'
}

export function getTransactionTypeClass(type: string): string {
  const typeMap: Record<string, string> = {
    TRADE: 'transaction-trade',
    SIGNING: 'transaction-signing',
    WAIVER: 'transaction-waiver',
    EXTENSION: 'transaction-extension',
    TWO_WAY: 'transaction-signing',
    TEN_DAY: 'transaction-signing',
    EXHIBIT_10: 'transaction-exhibit',
    CONTRACT_CONVERSION: 'transaction-conversion',
    WAIVER_CLAIM: 'transaction-waiver',
  }
  return typeMap[type] || ''
}

// Transaction type to Badge variant mapping
// Used consistently across all pages for transaction type badges
export type TransactionBadgeVariant = 'trade' | 'signing' | 'waiver' | 'extension' | 'exhibit' | 'conversion' | 'default'

export function getTransactionBadgeVariant(type: string): TransactionBadgeVariant {
  const variantMap: Record<string, TransactionBadgeVariant> = {
    TRADE: 'trade',
    SIGNING: 'signing',
    WAIVER: 'waiver',
    EXTENSION: 'extension',
    TWO_WAY: 'signing',
    TEN_DAY: 'signing',
    EXHIBIT_10: 'exhibit',
    CONTRACT_CONVERSION: 'conversion',
    WAIVER_CLAIM: 'waiver',
  }
  return variantMap[type] || 'default'
}

// Format transaction type for display (e.g., SIGN_AND_TRADE -> "Sign and Trade")
export function formatTransactionType(type: string): string {
  return type.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}
