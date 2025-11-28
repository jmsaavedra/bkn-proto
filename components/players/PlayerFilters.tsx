'use client'

import { useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDebouncedCallback } from 'use-debounce'

const positions = ['G', 'F', 'C', 'G-F', 'F-C', 'F-G', 'C-F']

export function PlayerFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(searchParams.get('q') || '')
  const [selectedPosition, setSelectedPosition] = useState(
    searchParams.get('position') || ''
  )

  const updateURL = useCallback((newSearch: string, newPosition: string) => {
    const params = new URLSearchParams()
    if (newSearch) params.set('q', newSearch)
    if (newPosition) params.set('position', newPosition)

    const queryString = params.toString()
    router.push(queryString ? `/players?${queryString}` : '/players')
  }, [router])

  const debouncedSearch = useDebouncedCallback((value: string) => {
    updateURL(value, selectedPosition)
  }, 300)

  const handleSearchChange = (value: string) => {
    setSearch(value)
    debouncedSearch(value)
  }

  const togglePosition = (position: string) => {
    const newPosition = selectedPosition === position ? '' : position
    setSelectedPosition(newPosition)
    updateURL(search, newPosition)
  }

  const clearFilters = () => {
    setSearch('')
    setSelectedPosition('')
    router.push('/players')
  }

  const hasFilters = search || selectedPosition

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

          {/* Position Filters */}
          <div>
            <div className="text-sm font-medium mb-2">Position</div>
            <div className="flex flex-wrap gap-2">
              {positions.map((position) => (
                <Badge
                  key={position}
                  variant={selectedPosition === position ? 'default' : 'outline'}
                  className={cn(
                    'cursor-pointer',
                    selectedPosition === position && 'bg-white text-black'
                  )}
                  onClick={() => togglePosition(position)}
                >
                  {position}
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
        </div>
      </CardContent>
    </Card>
  )
}
