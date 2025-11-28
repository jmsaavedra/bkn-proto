// Season cookie utilities (client-side safe)
export const SEASON_COOKIE_NAME = 'selected-season'
export const DEFAULT_SEASON = '2024-25'

// Client-side: get season from cookie
export function getSeasonFromCookie(): string {
  if (typeof document === 'undefined') return DEFAULT_SEASON
  const match = document.cookie.match(new RegExp(`(^| )${SEASON_COOKIE_NAME}=([^;]+)`))
  return match ? match[2] : DEFAULT_SEASON
}

// Client-side: set season cookie (1 year expiry)
export function setSeasonCookie(season: string): void {
  if (typeof document === 'undefined') return
  const expires = new Date()
  expires.setFullYear(expires.getFullYear() + 1)
  document.cookie = `${SEASON_COOKIE_NAME}=${season}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`
}
