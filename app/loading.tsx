import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export default function HomeLoading() {
  return (
    <div className="space-y-6 md:space-y-8">
      {/* Hero skeleton */}
      <section className="relative overflow-hidden rounded-xl md:rounded-2xl border border-white/10 bg-gradient-to-br from-black via-zinc-900 to-black p-5 md:p-12">
        <div className="flex flex-col items-center gap-4 md:gap-8 md:flex-row">
          <div className="w-20 h-20 md:w-40 md:h-40 bg-white/10 rounded-full animate-pulse" />
          <div className="text-center md:text-left space-y-3">
            <div className="h-4 w-32 bg-white/10 rounded animate-pulse mx-auto md:mx-0" />
            <div className="h-10 md:h-14 w-64 md:w-96 bg-white/10 rounded animate-pulse mx-auto md:mx-0" />
            <div className="h-4 w-48 bg-white/10 rounded animate-pulse mx-auto md:mx-0" />
          </div>
        </div>
      </section>

      {/* Stats skeleton */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-white/10">
            <CardHeader className="pb-2">
              <div className="h-4 w-20 bg-muted rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted rounded animate-pulse mb-1" />
              <div className="h-3 w-24 bg-muted rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Loading indicator */}
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    </div>
  )
}
