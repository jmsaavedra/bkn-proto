'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { setSeasonCookie, getSeasonFromCookie, DEFAULT_SEASON } from '@/lib/season'

const navigation = [
  { name: 'Dashboard', href: '/' },
  { name: 'Transactions', href: '/transactions' },
  { name: 'Players', href: '/players' },
]

const seasons = [
  { value: 'all', label: 'All Seasons' },
  { value: '2024-25', label: '2024-25' },
  { value: '2023-24', label: '2023-24' },
  { value: '2022-23', label: '2022-23' },
  { value: '2021-22', label: '2021-22' },
  { value: '2020-21', label: '2020-21' },
]

export function Header() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [selectedSeason, setSelectedSeason] = useState(DEFAULT_SEASON)

  // On mount, read from URL param first, then cookie
  useEffect(() => {
    const urlSeason = searchParams.get('season')
    if (urlSeason) {
      setSelectedSeason(urlSeason)
    } else {
      setSelectedSeason(getSeasonFromCookie())
    }
  }, [searchParams])

  const handleSeasonChange = (season: string) => {
    setSelectedSeason(season)
    setSeasonCookie(season)
    const params = new URLSearchParams(searchParams.toString())
    params.set('season', season)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/95 backdrop-blur supports-[backdrop-filter]:bg-black/80 hidden md:block">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex items-center">
          <Link href="/" className="mr-8 flex items-center space-x-3 group">
            {/* Nets Logo */}
            <div className="relative w-10 h-10 transition-transform group-hover:scale-105">
              <Image
                src="https://cdn.nba.com/logos/nba/1610612751/primary/L/logo.svg"
                alt="Brooklyn Nets"
                fill
                className="object-contain nets-glow"
                priority
              />
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="font-bold text-white tracking-wide text-lg leading-tight">
                NETS
              </span>
              <span className="text-[10px] text-nets-gray uppercase tracking-[0.2em]">
                Front Office
              </span>
            </div>
          </Link>
          <nav className="flex items-center space-x-1">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'px-4 py-2 rounded-md text-sm font-medium transition-all',
                  pathname === item.href
                    ? 'bg-white text-black'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                )}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-nets-gray">Season</span>
            <Select value={selectedSeason} onValueChange={handleSeasonChange}>
              <SelectTrigger className="w-[130px] h-8 bg-white/10 border-white/10 text-white font-semibold">
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
        </div>
      </div>
    </header>
  )
}
