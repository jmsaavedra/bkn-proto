import Image from 'next/image'

interface NetsLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'primary' | 'secondary' | 'wordmark'
  className?: string
}

const sizes = {
  sm: { width: 32, height: 32 },
  md: { width: 48, height: 48 },
  lg: { width: 64, height: 64 },
  xl: { width: 96, height: 96 },
}

export function NetsLogo({ size = 'md', variant = 'primary', className = '' }: NetsLogoProps) {
  const dimensions = sizes[size]

  // Brooklyn Nets official logo URLs
  const logoUrls = {
    primary: 'https://cdn.nba.com/logos/nba/1610612751/primary/L/logo.svg',
    secondary: 'https://cdn.nba.com/logos/nba/1610612751/secondary/L/logo.svg',
    wordmark: 'https://cdn.nba.com/logos/nba/1610612751/global/L/logo.svg',
  }

  return (
    <Image
      src={logoUrls[variant]}
      alt="Brooklyn Nets"
      width={dimensions.width}
      height={dimensions.height}
      className={`${className}`}
      priority
    />
  )
}

// SVG version for when we can't load external images
export function NetsLogoSVG({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg' | 'xl', className?: string }) {
  const dimensions = sizes[size]

  return (
    <svg
      viewBox="0 0 100 100"
      width={dimensions.width}
      height={dimensions.height}
      className={className}
      fill="currentColor"
    >
      {/* Simplified Nets "B" shield logo */}
      <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="4"/>
      <text
        x="50"
        y="65"
        textAnchor="middle"
        fontSize="50"
        fontWeight="bold"
        fontFamily="system-ui, sans-serif"
      >
        B
      </text>
    </svg>
  )
}
