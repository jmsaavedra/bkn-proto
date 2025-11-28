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
    BUYOUT: 'transaction-buyout',
    TWO_WAY: 'transaction-signing',
    TEN_DAY: 'transaction-signing',
    DRAFT_PICK: 'transaction-trade',
    SIGN_AND_TRADE: 'transaction-trade',
  }
  return typeMap[type] || ''
}
