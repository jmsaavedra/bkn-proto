'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, X, ChevronDown, ChevronUp, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'

const transactionTypes = [
  'TRADE',
  'SIGNING',
  'WAIVER',
  'EXTENSION',
  'BUYOUT',
  'TWO_WAY',
  'TEN_DAY',
  'DRAFT_PICK',
  'SIGN_AND_TRADE',
]

export function TransactionFilters() {
  const [search, setSearch] = useState('')
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [isExpanded, setIsExpanded] = useState(false)

  const toggleType = (type: string) => {
    setSelectedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
  }

  const clearFilters = () => {
    setSearch('')
    setSelectedTypes([])
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
                onChange={(e) => setSearch(e.target.value)}
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
                <Badge
                  key={type}
                  variant={selectedTypes.includes(type) ? 'default' : 'outline'}
                  className={cn(
                    'cursor-pointer text-[10px] px-2 py-1 touch-target',
                    selectedTypes.includes(type) && 'bg-white text-black'
                  )}
                  onClick={() => toggleType(type)}
                >
                  {type.replace('_', ' ')}
                </Badge>
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

            <p className="text-[10px] text-muted-foreground mt-3">
              Filters are UI-only for now
            </p>
          </div>

          {/* Selected Filters Pills (shown when collapsed) */}
          {!isExpanded && selectedTypes.length > 0 && (
            <div className="flex items-center gap-1.5 mt-2 overflow-x-auto scrollbar-hide pb-1">
              {selectedTypes.slice(0, 3).map((type) => (
                <Badge
                  key={type}
                  variant="default"
                  className="text-[10px] px-2 py-0.5 bg-white/10 flex-shrink-0"
                >
                  {type.replace('_', ' ')}
                </Badge>
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
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Transaction Type Filters */}
          <div>
            <div className="text-sm font-medium mb-2">Transaction Type</div>
            <div className="flex flex-wrap gap-2">
              {transactionTypes.map((type) => (
                <Badge
                  key={type}
                  variant={selectedTypes.includes(type) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleType(type)}
                >
                  {type.replace('_', ' ')}
                </Badge>
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

          {/* Note about filters */}
          <p className="text-xs text-muted-foreground">
            Note: Filters are UI-only for now. Full filtering will be implemented with API integration.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
