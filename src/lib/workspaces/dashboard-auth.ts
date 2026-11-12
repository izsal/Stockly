import 'server-only'

import { redirect } from 'next/navigation'
import { getSession } from '@/src/lib/auth-session'
import { getCurrentWorkspaceForUser } from './current'

export async function requireDashboardWorkspace() {
  const session = await getSession()
  if (!session?.user) {
    redirect('/sign-in')
  }

  const workspace = await getCurrentWorkspaceForUser(session.user.id)
  return { session, workspace }
}

