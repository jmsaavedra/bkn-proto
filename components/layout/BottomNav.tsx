'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Home, FileText, Settings, TrendingUp } from 'lucide-react'

const navigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Transactions', href: '/transactions', icon: FileText },
  { name: 'Analytics', href: '#', icon: TrendingUp, disabled: true },
  { name: 'Settings', href: '#', icon: Settings, disabled: true },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur border-t border-white/10 md:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.name}
              href={item.disabled ? '#' : item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full px-2 transition-colors',
                item.disabled && 'opacity-40 pointer-events-none',
                isActive
                  ? 'text-white'
                  : 'text-white/50 hover:text-white/70'
              )}
              aria-disabled={item.disabled}
            >
              <Icon className={cn(
                'h-5 w-5 mb-1',
                isActive && 'text-white'
              )} />
              <span className={cn(
                'text-[10px] font-medium tracking-wide',
                isActive && 'text-white'
              )}>
                {item.name}
              </span>
              {isActive && (
                <div className="absolute top-0 w-12 h-0.5 bg-white rounded-b" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
