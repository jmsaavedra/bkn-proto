import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight, TrendingUp, Users, DollarSign, FileText, Target, BarChart3 } from 'lucide-react'

export default function Home() {
  return (
    <div className="space-y-8">
      {/* Hero Section with Nets Branding */}
      <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-black via-zinc-900 to-black p-8 md:p-12">
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

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          {/* Logo Section */}
          <div className="flex-shrink-0">
            <div className="relative w-32 h-32 md:w-40 md:h-40">
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
              <span className="text-xs font-semibold tracking-[0.3em] text-nets-gray uppercase">
                Brooklyn Nets
              </span>
              <span className="text-nets-gray">|</span>
              <span className="text-xs font-semibold tracking-[0.3em] text-nets-gray uppercase">
                Front Office
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
              Transaction Evaluator
            </h1>
            <p className="text-lg text-zinc-400 max-w-xl">
              Analyze and evaluate NBA transactions from across the league.
              Research trades, signings, and roster moves to build a championship roster.
            </p>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      </section>

      {/* Quick Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="stat-card border-white/10 hover:border-white/20 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Transactions</CardTitle>
            <FileText className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">--</div>
            <p className="text-xs text-zinc-500">Last 12 months</p>
          </CardContent>
        </Card>

        <Card className="stat-card border-white/10 hover:border-white/20 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Trades</CardTitle>
            <TrendingUp className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">--</div>
            <p className="text-xs text-zinc-500">Last 12 months</p>
          </CardContent>
        </Card>

        <Card className="stat-card border-white/10 hover:border-white/20 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Players</CardTitle>
            <Users className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">--</div>
            <p className="text-xs text-zinc-500">Active in database</p>
          </CardContent>
        </Card>

        <Card className="stat-card border-white/10 hover:border-white/20 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">2024-25 Cap</CardTitle>
            <DollarSign className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">$140.6M</div>
            <p className="text-xs text-zinc-500">Salary cap</p>
          </CardContent>
        </Card>
      </section>

      {/* Main Actions */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="group border-white/10 hover:border-white/30 transition-all duration-300 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="relative">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-white/10">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <CardTitle className="text-xl text-white">Browse Transactions</CardTitle>
            </div>
            <CardDescription className="text-zinc-400">
              Search and filter through all NBA transactions from the past 5 years.
              View trades, signings, waivers, extensions, and more.
            </CardDescription>
          </CardHeader>
          <CardContent className="relative">
            <Link href="/transactions">
              <Button className="w-full bg-white text-black hover:bg-zinc-200 font-semibold">
                View All Transactions
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="group border-white/10 hover:border-white/30 transition-all duration-300 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="relative">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-white/10">
                <Target className="h-5 w-5 text-white" />
              </div>
              <CardTitle className="text-xl text-white">Evaluation Settings</CardTitle>
            </div>
            <CardDescription className="text-zinc-400">
              Customize how transactions are scored by adjusting weights for
              surplus value, win-now impact, cap flexibility, and more.
            </CardDescription>
          </CardHeader>
          <CardContent className="relative">
            <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10" disabled>
              Configure Weights
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Salary Cap Quick Reference */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">2024-25 Salary Cap Reference</h2>
          <span className="text-xs text-zinc-500 uppercase tracking-wider">2023 CBA</span>
        </div>
        <Card className="border-white/10">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Salary Cap</p>
                <p className="text-2xl font-bold text-white">$140.6M</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Luxury Tax</p>
                <p className="text-2xl font-bold text-white">$170.8M</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">First Apron</p>
                <p className="text-2xl font-bold text-white">$178.1M</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Second Apron</p>
                <p className="text-2xl font-bold text-white">$188.9M</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Recent Activity Placeholder */}
      <section>
        <h2 className="text-xl font-semibold text-white mb-4">Recent Transactions</h2>
        <Card className="border-white/10 border-dashed">
          <CardContent className="py-16 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 mb-4">
              <FileText className="h-8 w-8 text-zinc-600" />
            </div>
            <p className="text-zinc-400 font-medium">No transactions loaded yet</p>
            <p className="text-sm text-zinc-600 mt-2 max-w-md mx-auto">
              Run the Python seeding scripts in the <code className="text-zinc-400 bg-white/5 px-1.5 py-0.5 rounded">/scripts</code> directory to populate the database with transaction data.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Footer Note */}
      <footer className="text-center py-8 border-t border-white/10">
        <p className="text-xs text-zinc-600">
          Brooklyn Nets Front Office Transaction Evaluator
        </p>
        <p className="text-xs text-zinc-700 mt-1">
          Data sourced from NBA.com, Basketball-Reference, and Spotrac
        </p>
      </footer>
    </div>
  )
}
