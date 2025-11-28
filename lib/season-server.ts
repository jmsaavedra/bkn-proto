import { cookies } from 'next/headers'
import { SEASON_COOKIE_NAME, DEFAULT_SEASON } from './season'

// Server-side: get season from cookie (for use in server components/pages)
export async function getSeasonFromCookieServer(): Promise<string> {
  const cookieStore = await cookies()
  return cookieStore.get(SEASON_COOKIE_NAME)?.value || DEFAULT_SEASON
}
