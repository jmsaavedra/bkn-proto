'use client'

import { useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDebouncedCallback } from 'use-debounce'

const sortOptions = [
  { value: 'name-asc', label: 'Name (A-Z)' },
  { value: 'name-desc', label: 'Name (Z-A)' },
  { value: 'age-asc', label: 'Age (Youngest)' },
  { value: 'age-desc', label: 'Age (Oldest)' },
  { value: 'contract-desc', label: 'Contract (Highest)' },
  { value: 'contract-asc', label: 'Contract (Lowest)' },
]

const positions = [
  { value: 'Guard', label: 'G' },
  { value: 'Forward', label: 'F' },
  { value: 'Center', label: 'C' },
  { value: 'Guard-Forward', label: 'G-F' },
  { value: 'Forward-Guard', label: 'F-G' },
  { value: 'Forward-Center', label: 'F-C' },
  { value: 'Center-Forward', label: 'C-F' },
]

export function PlayerFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(searchParams.get('q') || '')
  const [selectedPositions, setSelectedPositions] = useState<string[]>(
    searchParams.get('position')?.split(',').filter(Boolean) || []
  )
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'name-asc')

  const updateURL = useCallback((newSearch: string, newPositions: string[], newSort: string) => {
    const params = new URLSearchParams()
    if (newSearch) params.set('q', newSearch)
    if (newPositions.length > 0) params.set('position', newPositions.join(','))
    if (newSort && newSort !== 'name-asc') params.set('sort', newSort)

    const queryString = params.toString()
    router.push(queryString ? `/players?${queryString}` : '/players')
  }, [router])

  const debouncedSearch = useDebouncedCallback((value: string) => {
    updateURL(value, selectedPositions, sortBy)
  }, 300)

  const handleSearchChange = (value: string) => {
    setSearch(value)
    debouncedSearch(value)
  }

  const togglePosition = (position: string) => {
    const newPositions = selectedPositions.includes(position)
      ? selectedPositions.filter(p => p !== position)
      : [...selectedPositions, position]
    setSelectedPositions(newPositions)
    updateURL(search, newPositions, sortBy)
  }

  const handleSortChange = (value: string) => {
    setSortBy(value)
    updateURL(search, selectedPositions, value)
  }

  const clearFilters = () => {
    setSearch('')
    setSelectedPositions([])
    setSortBy('name-asc')
    router.push('/players')
  }

  const hasFilters = search || selectedPositions.length > 0 || sortBy !== 'name-asc'

  return (
    <Card>
      <CardContent className="p-3 md:p-4">
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search players..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Position Filters and Sort */}
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <div className="flex-1">
              <div className="text-sm font-medium mb-2">Position</div>
              <div className="flex flex-wrap gap-2">
                {positions.map((pos) => (
                  <Badge
                    key={pos.value}
                    variant={selectedPositions.includes(pos.value) ? 'default' : 'outline'}
                    className={cn(
                      'cursor-pointer',
                      selectedPositions.includes(pos.value) && 'bg-white text-black'
                    )}
                    onClick={() => togglePosition(pos.value)}
                  >
                    {pos.label}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="w-full md:w-48">
              <div className="text-sm font-medium mb-2">Sort By</div>
              <Select value={sortBy} onValueChange={handleSortChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
