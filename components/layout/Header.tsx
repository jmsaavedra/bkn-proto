'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/' },
  { name: 'Transactions', href: '/transactions' },
]

export function Header() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/95 backdrop-blur supports-[backdrop-filter]:bg-black/80">
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
            <span className="font-semibold text-white px-2 py-1 bg-white/10 rounded">
              2024-25
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
