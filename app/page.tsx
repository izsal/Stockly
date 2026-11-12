import { LandingPage } from '@/src/components/marketing/landing-page'
import { getSession } from '@/src/lib/auth-session'

export default async function HomePage() {
  const session = await getSession().catch(() => null)
  return <LandingPage isAuthenticated={Boolean(session?.user)} />
}
