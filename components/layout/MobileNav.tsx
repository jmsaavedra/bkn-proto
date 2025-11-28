'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Menu, X } from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/' },
  { name: 'Transactions', href: '/transactions' },
  { name: 'Players', href: '/players' },
]

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  return (
    <>
      {/* Mobile Header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/95 backdrop-blur supports-[backdrop-filter]:bg-black/80 md:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="/" className="flex items-center space-x-2">
            <div className="relative w-8 h-8">
              <Image
                src="https://cdn.nba.com/logos/nba/1610612751/primary/L/logo.svg"
                alt="Brooklyn Nets"
                fill
                className="object-contain nets-glow"
                priority
              />
            </div>
            <span className="font-bold text-white text-sm tracking-wide">
              NETS
            </span>
          </Link>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            aria-label="Toggle menu"
          >
            {isOpen ? (
              <X className="h-5 w-5 text-white" />
            ) : (
              <Menu className="h-5 w-5 text-white" />
            )}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/80 backdrop-blur-sm transition-opacity duration-300 md:hidden',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={() => setIsOpen(false)}
      />

      {/* Mobile Menu Panel */}
      <div
        className={cn(
          'fixed top-14 left-0 right-0 z-40 bg-black border-b border-white/10 transition-transform duration-300 ease-out md:hidden',
          isOpen ? 'translate-y-0' : '-translate-y-full'
        )}
      >
        <nav className="p-4 space-y-2">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center px-4 py-3 rounded-lg text-base font-medium transition-all',
                pathname === item.href
                  ? 'bg-white text-black'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              )}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Season Badge in Mobile Menu */}
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
            <span className="text-sm text-nets-gray">Current Season</span>
            <span className="font-semibold text-white px-2 py-1 bg-white/10 rounded text-sm">
              2024-25
            </span>
          </div>
        </div>
      </div>
    </>
  )
}
