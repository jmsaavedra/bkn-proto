import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Header } from '@/components/layout/Header'
import { MobileNav } from '@/components/layout/MobileNav'
import { BottomNav } from '@/components/layout/BottomNav'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Nets Transaction Evaluator',
  description: 'NBA transaction analysis and evaluation for the Brooklyn Nets front office',
  metadataBase: new URL('https://bkn.josdotph.com'),
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
  openGraph: {
    title: 'Nets Transaction Evaluator',
    description: 'NBA transaction analysis and evaluation for the Brooklyn Nets front office',
    url: 'https://bkn.josdotph.com',
    siteName: 'Nets Transaction Evaluator',
    images: [
      {
        url: '/metaog.jpg',
        width: 1200,
        height: 630,
        alt: 'Nets Transaction Evaluator',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nets Transaction Evaluator',
    description: 'NBA transaction analysis and evaluation for the Brooklyn Nets front office',
    images: ['/metaog.jpg'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Nets FO',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-background">
          {/* Desktop Header */}
          <Header />
          {/* Mobile Header */}
          <MobileNav />

          <main className="container mx-auto px-4 py-4 md:py-6 pb-20 md:pb-6">
            {children}
          </main>

          {/* Mobile Bottom Navigation */}
          <BottomNav />
        </div>
      </body>
    </html>
  )
}
