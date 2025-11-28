'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, X } from 'lucide-react'

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
      <CardContent className="p-4">
        <div className="space-y-4">
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
