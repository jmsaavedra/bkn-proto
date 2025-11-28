'use client'

import { useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, X, ChevronDown, ChevronUp, Filter } from 'lucide-react'
import { cn, getTransactionBadgeVariant, formatTransactionType } from '@/lib/utils'
import { useDebouncedCallback } from 'use-debounce'

const transactionTypes = [
  'TRADE',
  'SIGNING',
  'WAIVER',
  'EXTENSION',
  'TWO_WAY',
  'TEN_DAY',
  'EXHIBIT_10',
  'CONTRACT_CONVERSION',
  'WAIVER_CLAIM',
]

// Color classes for each transaction type - bright (selected) and dimmed (unselected)
const typeColorClasses: Record<string, { selected: string; unselected: string }> = {
  trade: {
    selected: 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700',
    unselected: 'bg-blue-950/30 text-blue-400 border-blue-800/50 hover:bg-blue-900/40 hover:border-blue-700',
  },
  signing: {
    selected: 'bg-green-600 text-white border-green-600 hover:bg-green-700',
    unselected: 'bg-green-950/30 text-green-400 border-green-800/50 hover:bg-green-900/40 hover:border-green-700',
  },
  waiver: {
    selected: 'bg-red-600 text-white border-red-600 hover:bg-red-700',
    unselected: 'bg-red-950/30 text-red-400 border-red-800/50 hover:bg-red-900/40 hover:border-red-700',
  },
  extension: {
    selected: 'bg-purple-600 text-white border-purple-600 hover:bg-purple-700',
    unselected: 'bg-purple-950/30 text-purple-400 border-purple-800/50 hover:bg-purple-900/40 hover:border-purple-700',
  },
  exhibit: {
    selected: 'bg-amber-600 text-white border-amber-600 hover:bg-amber-700',
    unselected: 'bg-amber-950/30 text-amber-400 border-amber-800/50 hover:bg-amber-900/40 hover:border-amber-700',
  },
  conversion: {
    selected: 'bg-cyan-600 text-white border-cyan-600 hover:bg-cyan-700',
    unselected: 'bg-cyan-950/30 text-cyan-400 border-cyan-800/50 hover:bg-cyan-900/40 hover:border-cyan-700',
  },
  default: {
    selected: 'bg-zinc-600 text-white border-zinc-600 hover:bg-zinc-700',
    unselected: 'bg-zinc-950/30 text-zinc-400 border-zinc-800/50 hover:bg-zinc-900/40 hover:border-zinc-700',
  },
}

function getFilterChipClasses(type: string, isSelected: boolean): string {
  const variant = getTransactionBadgeVariant(type)
  const colors = typeColorClasses[variant] || typeColorClasses.default
  return isSelected ? colors.selected : colors.unselected
}

export function TransactionFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Initialize state from URL params
  const [search, setSearch] = useState(searchParams.get('q') || '')
  const [selectedTypes, setSelectedTypes] = useState<string[]>(
    searchParams.get('type')?.split(',').filter(Boolean) || []
  )
  const [isExpanded, setIsExpanded] = useState(false)

  // Update URL when filters change
  const updateURL = useCallback((newSearch: string, newTypes: string[]) => {
    const params = new URLSearchParams()
    if (newSearch) params.set('q', newSearch)
    if (newTypes.length > 0) params.set('type', newTypes.join(','))

    const queryString = params.toString()
    router.push(queryString ? `/transactions?${queryString}` : '/transactions')
  }, [router])

  // Debounced search to avoid too many URL updates
  const debouncedSearch = useDebouncedCallback((value: string) => {
    updateURL(value, selectedTypes)
  }, 300)

  const handleSearchChange = (value: string) => {
    setSearch(value)
    debouncedSearch(value)
  }

  const toggleType = (type: string) => {
    const newTypes = selectedTypes.includes(type)
      ? selectedTypes.filter(t => t !== type)
      : [...selectedTypes, type]
    setSelectedTypes(newTypes)
    updateURL(search, newTypes)
  }

  const clearFilters = () => {
    setSearch('')
    setSelectedTypes([])
    router.push('/transactions')
  }

  const hasFilters = search || selectedTypes.length > 0

  return (
    <Card>
      <CardContent className="p-3 md:p-4">
        {/* Mobile Collapsed View */}
        <div className="md:hidden">
          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9 h-10"
              />
            </div>

            {/* Filter Toggle Button */}
            <Button
              variant="outline"
              size="sm"
              className={cn(
                'h-10 px-3 flex items-center gap-1.5',
                hasFilters && 'border-white/30 bg-white/5'
              )}
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <Filter className="h-4 w-4" />
              {selectedTypes.length > 0 && (
                <span className="text-xs bg-white text-black rounded-full w-5 h-5 flex items-center justify-center">
                  {selectedTypes.length}
                </span>
              )}
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Expandable Filter Section */}
          <div
            className={cn(
              'overflow-hidden transition-all duration-300 ease-out',
              isExpanded ? 'max-h-96 mt-3 pt-3 border-t border-white/10' : 'max-h-0'
            )}
          >
            <div className="text-xs font-medium text-muted-foreground mb-2">
              Transaction Type
            </div>
            <div className="flex flex-wrap gap-1.5">
              {transactionTypes.map((type) => (
                <button
                  key={type}
                  className={cn(
                    'inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold transition-colors cursor-pointer touch-target',
                    getFilterChipClasses(type, selectedTypes.includes(type))
                  )}
                  onClick={() => toggleType(type)}
                >
                  {formatTransactionType(type)}
                </button>
              ))}
            </div>

            {/* Clear Filters - Mobile */}
            {hasFilters && (
              <div className="mt-3 pt-3 border-t border-white/10">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="w-full h-9"
                >
                  <X className="mr-2 h-4 w-4" />
                  Clear All Filters
                </Button>
              </div>
            )}

          </div>

          {/* Selected Filters Pills (shown when collapsed) */}
          {!isExpanded && selectedTypes.length > 0 && (
            <div className="flex items-center gap-1.5 mt-2 overflow-x-auto scrollbar-hide pb-1">
              {selectedTypes.slice(0, 3).map((type) => (
                <span
                  key={type}
                  className={cn(
                    'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold flex-shrink-0',
                    getFilterChipClasses(type, true)
                  )}
                >
                  {formatTransactionType(type)}
                </span>
              ))}
              {selectedTypes.length > 3 && (
                <span className="text-[10px] text-muted-foreground flex-shrink-0">
                  +{selectedTypes.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Desktop View */}
        <div className="hidden md:block space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Transaction Type Filters */}
          <div>
            <div className="text-sm font-medium mb-2">Transaction Type</div>
            <div className="flex flex-wrap gap-2">
              {transactionTypes.map((type) => (
                <button
                  key={type}
                  className={cn(
                    'inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-colors cursor-pointer',
                    getFilterChipClasses(type, selectedTypes.includes(type))
                  )}
                  onClick={() => toggleType(type)}
                >
                  {formatTransactionType(type)}
                </button>
              ))}
            </div>
          </div>

          {/* Clear Filters */}
          {hasFilters && (
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="mr-2 h-4 w-4" />
                Clear Filters
              </Button>
            </div>
          )}

        </div>
      </CardContent>
    </Card>
  )
}
