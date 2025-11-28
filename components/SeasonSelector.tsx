'use client'

import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const seasons = [
  { value: 'all', label: 'All Seasons' },
  { value: '2024-25', label: '2024-25' },
  { value: '2023-24', label: '2023-24' },
  { value: '2022-23', label: '2022-23' },
  { value: '2021-22', label: '2021-22' },
  { value: '2020-21', label: '2020-21' },
]

interface SeasonSelectorProps {
  className?: string
}

export function SeasonSelector({ className }: SeasonSelectorProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const selectedSeason = searchParams.get('season') || '2024-25'

  const handleSeasonChange = (season: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('season', season)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className={className}>
      <Select value={selectedSeason} onValueChange={handleSeasonChange}>
        <SelectTrigger className="w-[130px] h-9 bg-white/10 border-white/20 text-white font-semibold">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {seasons.map((season) => (
            <SelectItem key={season.value} value={season.value}>
              {season.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
