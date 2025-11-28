import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Suspense } from 'react'
import './globals.css'
import { Header } from '@/components/layout/Header'
import { MobileNav } from '@/components/layout/MobileNav'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Nets Contract Evaluator',
  description: 'NBA contract analysis and evaluation for the Brooklyn Nets front office',
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
    title: 'Nets Contract Evaluator',
    description: 'NBA contract analysis and evaluation for the Brooklyn Nets front office',
    url: 'https://bkn.josdotph.com',
    siteName: 'Nets Contract Evaluator',
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
    title: 'Nets Contract Evaluator',
    description: 'NBA contract analysis and evaluation for the Brooklyn Nets front office',
    images: ['/metaog.jpg'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Nets FO',
  },
  icons: {
    icon: [
      { url: '/favicon/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    shortcut: '/favicon/favicon.ico',
    apple: '/favicon/apple-touch-icon.png',
  },
  manifest: '/favicon/site.webmanifest',
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
          <Suspense fallback={null}>
            <Header />
          </Suspense>
          {/* Mobile Header */}
          <Suspense fallback={null}>
            <MobileNav />
          </Suspense>

          <main className="container mx-auto px-4 py-4 md:py-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
