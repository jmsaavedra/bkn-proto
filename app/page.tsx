import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, TrendingUp, Users, DollarSign, FileText, Target, BarChart3 } from 'lucide-react'
import connectDB from '@/lib/mongodb'
import Transaction from '@/lib/models/Transaction'
import Player from '@/lib/models/Player'
import Team from '@/lib/models/Team'
import SalaryCap from '@/lib/models/SalaryCap'
import { getTransactionBadgeVariant, formatTransactionType, formatDate } from '@/lib/utils'

// Ensure models are registered
void Team

// Make page dynamic so it fetches fresh data
export const dynamic = 'force-dynamic'

// Helper to get date range for an NBA season (e.g., "2024-25" = Oct 2024 - Sep 2025)
function getSeasonDateRange(season: string) {
  const [startYear] = season.split('-').map(Number)
  const seasonStart = new Date(startYear, 9, 1) // October 1st
  const seasonEnd = new Date(startYear + 1, 8, 30) // September 30th
  return { seasonStart, seasonEnd }
}

async function getDashboardStats(season: string) {
  await connectDB()

  const { seasonStart, seasonEnd } = getSeasonDateRange(season)
  const dateFilter = { date: { $gte: seasonStart, $lte: seasonEnd } }

  const [transactionCount, tradeCount, playerCount, salaryCap] = await Promise.all([
    Transaction.countDocuments(dateFilter),
    Transaction.countDocuments({ ...dateFilter, type: 'TRADE' }),
    Player.countDocuments({ status: 'active' }),
    SalaryCap.findOne({ season }).lean(),
  ])

  return {
    transactionCount,
    tradeCount,
    playerCount,
    salaryCap,
    season,
  }
}

async function getRecentTransactions(season: string) {
  await connectDB()

  const { seasonStart, seasonEnd } = getSeasonDateRange(season)

  const transactions = await Transaction.find({
    date: { $gte: seasonStart, $lte: seasonEnd }
  })
    .sort({ date: -1 })
    .limit(5)
    .populate('teams.teamId')
    .lean()

  return transactions
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ season?: string }>
}) {
  const params = await searchParams
  const season = params.season || '2024-25'

  const [stats, recentTransactions] = await Promise.all([
    getDashboardStats(season),
    getRecentTransactions(season),
  ])
  return (
    <div className="space-y-6 md:space-y-8">
      {/* Hero Section with Nets Branding */}
      <section className="relative overflow-hidden rounded-xl md:rounded-2xl border border-white/10 bg-gradient-to-br from-black via-zinc-900 to-black p-5 md:p-12">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 10px,
              rgba(255,255,255,0.03) 10px,
              rgba(255,255,255,0.03) 20px
            )`
          }} />
        </div>

        <div className="relative z-10 flex flex-col items-center gap-4 md:gap-8 md:flex-row">
          {/* Logo Section */}
          <div className="flex-shrink-0">
            <div className="relative w-20 h-20 md:w-40 md:h-40">
              <Image
                src="https://cdn.nba.com/logos/nba/1610612751/primary/L/logo.svg"
                alt="Brooklyn Nets"
                fill
                className="object-contain nets-glow"
                priority
              />
            </div>
          </div>

          {/* Text Content */}
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
              <span className="text-[10px] md:text-xs font-semibold tracking-[0.2em] md:tracking-[0.3em] text-nets-gray uppercase">
                Brooklyn Nets
              </span>
              <span className="text-nets-gray hidden md:inline">|</span>
              <span className="text-[10px] md:text-xs font-semibold tracking-[0.2em] md:tracking-[0.3em] text-nets-gray uppercase hidden md:inline">
                Front Office
              </span>
            </div>
            <h1 className="text-2xl md:text-5xl font-bold tracking-tight text-white mb-2 md:mb-4">
              Contract Evaluator
            </h1>
            <p className="text-sm md:text-lg text-zinc-400 max-w-xl">
              Analyze and evaluate NBA transactions from across the league.
              <span className="hidden md:inline"> Research trades, signings, and roster moves to build a championship roster.</span>
            </p>
          </div>
        </div>

        {/* Decorative Elements - hidden on mobile */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 hidden md:block" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 hidden md:block" />
      </section>

      {/* Quick Stats - Horizontal scroll on mobile */}
      <section>
        <div className="hidden md:grid md:grid-cols-4 gap-4">
          <StatCard
            title="Transactions"
            value={stats.transactionCount.toLocaleString()}
            subtitle={`${season} season`}
            icon={<FileText className="h-4 w-4 text-zinc-500" />}
          />
          <StatCard
            title="Trades"
            value={stats.tradeCount.toLocaleString()}
            subtitle={`${season} season`}
            icon={<TrendingUp className="h-4 w-4 text-zinc-500" />}
          />
          <StatCard
            title="Players"
            value={stats.playerCount.toLocaleString()}
            subtitle="Active in database"
            icon={<Users className="h-4 w-4 text-zinc-500" />}
          />
          <StatCard
            title={`${season} Cap`}
            value={stats.salaryCap ? `$${(stats.salaryCap.salaryCap / 1000000).toFixed(1)}M` : 'N/A'}
            subtitle="Salary cap"
            icon={<DollarSign className="h-4 w-4 text-zinc-500" />}
          />
        </div>
        {/* Mobile horizontal scroll */}
        <div className="flex md:hidden overflow-x-auto scrollbar-hide gap-3 pb-2 -mx-4 px-4 snap-x snap-mandatory">
          <div className="min-w-[140px] snap-start">
            <StatCard
              title="Transactions"
              value={stats.transactionCount.toLocaleString()}
              subtitle={season}
              icon={<FileText className="h-4 w-4 text-zinc-500" />}
              compact
            />
          </div>
          <div className="min-w-[140px] snap-start">
            <StatCard
              title="Trades"
              value={stats.tradeCount.toLocaleString()}
              subtitle={season}
              icon={<TrendingUp className="h-4 w-4 text-zinc-500" />}
              compact
            />
          </div>
          <div className="min-w-[140px] snap-start">
            <StatCard
              title="Players"
              value={stats.playerCount.toLocaleString()}
              subtitle="Active"
              icon={<Users className="h-4 w-4 text-zinc-500" />}
              compact
            />
          </div>
          <div className="min-w-[140px] snap-start">
            <StatCard
              title={`${season} Cap`}
              value={stats.salaryCap ? `$${(stats.salaryCap.salaryCap / 1000000).toFixed(1)}M` : 'N/A'}
              subtitle="Salary cap"
              icon={<DollarSign className="h-4 w-4 text-zinc-500" />}
              compact
            />
          </div>
        </div>
      </section>

      {/* Main Actions */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
        <Card className="group border-white/10 hover:border-white/30 transition-all duration-300 overflow-hidden touch-active relative">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <CardHeader className="relative p-4 md:p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-white/10">
                <BarChart3 className="h-4 w-4 md:h-5 md:w-5 text-white" />
              </div>
              <CardTitle className="text-lg md:text-xl text-white">Browse Transactions</CardTitle>
            </div>
            <CardDescription className="text-zinc-400 text-sm">
              Search and filter through all NBA transactions.
              <span className="hidden md:inline"> View trades, signings, waivers, extensions, and more.</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="relative p-4 pt-0 md:p-6 md:pt-0">
            <Button asChild className="w-full bg-white text-black hover:bg-zinc-200 font-semibold h-11 md:h-10">
              <Link href="/transactions">
                View All Transactions
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="group border-white/10 hover:border-white/30 transition-all duration-300 overflow-hidden touch-active relative">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <CardHeader className="relative p-4 md:p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-white/10">
                <Target className="h-4 w-4 md:h-5 md:w-5 text-white" />
              </div>
              <CardTitle className="text-lg md:text-xl text-white">Evaluation Settings</CardTitle>
            </div>
            <CardDescription className="text-zinc-400 text-sm">
              Customize how transactions are scored.
              <span className="hidden md:inline"> Adjust weights for surplus value, win-now impact, cap flexibility, and more.</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="relative p-4 pt-0 md:p-6 md:pt-0">
            <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10 h-11 md:h-10" disabled>
              Configure Weights
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Salary Cap Quick Reference */}
      <section>
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <h2 className="text-lg md:text-xl font-semibold text-white">{season} Salary Cap</h2>
          <span className="text-[10px] md:text-xs text-zinc-500 uppercase tracking-wider">CBA</span>
        </div>
        <Card className="border-white/10">
          <CardContent className="p-4 md:p-6">
            {/* Desktop grid */}
            <div className="hidden md:grid md:grid-cols-4 gap-6">
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Salary Cap</p>
                <p className="text-2xl font-bold text-white">
                  {stats.salaryCap ? `$${(stats.salaryCap.salaryCap / 1000000).toFixed(1)}M` : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Luxury Tax</p>
                <p className="text-2xl font-bold text-white">
                  {stats.salaryCap ? `$${(stats.salaryCap.luxuryTax / 1000000).toFixed(1)}M` : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">First Apron</p>
                <p className="text-2xl font-bold text-white">
                  {stats.salaryCap?.firstApron ? `$${(stats.salaryCap.firstApron / 1000000).toFixed(1)}M` : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Second Apron</p>
                <p className="text-2xl font-bold text-white">
                  {stats.salaryCap?.secondApron ? `$${(stats.salaryCap.secondApron / 1000000).toFixed(1)}M` : 'N/A'}
                </p>
              </div>
            </div>
            {/* Mobile 2x2 grid */}
            <div className="grid grid-cols-2 gap-4 md:hidden">
              <div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-0.5">Salary Cap</p>
                <p className="text-xl font-bold text-white">
                  {stats.salaryCap ? `$${(stats.salaryCap.salaryCap / 1000000).toFixed(1)}M` : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-0.5">Luxury Tax</p>
                <p className="text-xl font-bold text-white">
                  {stats.salaryCap ? `$${(stats.salaryCap.luxuryTax / 1000000).toFixed(1)}M` : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-0.5">First Apron</p>
                <p className="text-xl font-bold text-white">
                  {stats.salaryCap?.firstApron ? `$${(stats.salaryCap.firstApron / 1000000).toFixed(1)}M` : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-0.5">Second Apron</p>
                <p className="text-xl font-bold text-white">
                  {stats.salaryCap?.secondApron ? `$${(stats.salaryCap.secondApron / 1000000).toFixed(1)}M` : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Recent Transactions */}
      <section>
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <h2 className="text-lg md:text-xl font-semibold text-white">Recent Transactions</h2>
          <Button asChild variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
            <Link href="/transactions">
              View All
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
        {recentTransactions.length > 0 ? (
          <div className="space-y-3">
            {recentTransactions.map((transaction: any) => {
              const teams = transaction.teams?.map((t: any) => t.teamId?.abbreviation).filter(Boolean).join(' ↔ ') || 'N/A'
              return (
                <Link key={transaction._id} href={`/transactions/${transaction._id}`}>
                  <Card className="border-white/10 hover:border-white/20 hover:bg-white/5 transition-all cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={getTransactionBadgeVariant(transaction.type || '')} className="text-xs">
                              {formatTransactionType(transaction.type || '')}
                            </Badge>
                            <span className="text-xs text-zinc-500">{teams}</span>
                          </div>
                          <p className="text-sm text-white font-medium truncate">
                            {transaction.details?.headline || 'Transaction'}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs text-zinc-500">{formatDate(transaction.date)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        ) : (
          <Card className="border-white/10 border-dashed">
            <CardContent className="py-10 md:py-16 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-full bg-white/5 mb-3 md:mb-4">
                <FileText className="h-6 w-6 md:h-8 md:w-8 text-zinc-600" />
              </div>
              <p className="text-zinc-400 font-medium text-sm md:text-base">No transactions loaded yet</p>
              <p className="text-xs md:text-sm text-zinc-600 mt-2 max-w-md mx-auto px-4">
                Run the seeding scripts in <code className="text-zinc-400 bg-white/5 px-1.5 py-0.5 rounded">/scripts</code> to populate the database.
              </p>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Footer Note */}
      <footer className="text-center py-6 md:py-8 border-t border-white/10">
        <p className="text-[10px] md:text-xs text-zinc-600">
          Brooklyn Nets Front Office Contract Evaluator
        </p>
        <p className="text-[10px] md:text-xs text-zinc-700 mt-1">
          Data sourced from NBA.com, Basketball-Reference, and Spotrac
        </p>
      </footer>
    </div>
  )
}

// Reusable stat card component
function StatCard({
  title,
  value,
  subtitle,
  icon,
  compact = false,
}: {
  title: string
  value: string
  subtitle: string
  icon: React.ReactNode
  compact?: boolean
}) {
  return (
    <Card className="stat-card border-white/10 hover:border-white/20 transition-colors">
      <CardHeader className={`flex flex-row items-center justify-between space-y-0 ${compact ? 'p-3 pb-1' : 'pb-2'}`}>
        <CardTitle className={`font-medium text-zinc-400 ${compact ? 'text-xs' : 'text-sm'}`}>{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent className={compact ? 'p-3 pt-0' : ''}>
        <div className={`font-bold text-white ${compact ? 'text-xl' : 'text-3xl'}`}>{value}</div>
        <p className={`text-zinc-500 ${compact ? 'text-[10px]' : 'text-xs'}`}>{subtitle}</p>
      </CardContent>
    </Card>
  )
}
