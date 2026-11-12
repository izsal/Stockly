import 'server-only'

import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '@/src/db'
import { authSchema } from '@/src/db/schema/auth'
import { provisionWorkspaceForUser } from '@/src/lib/workspaces/provision'

const resolvedBaseUrl =
  process.env.BETTER_AUTH_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.V0_RUNTIME_URL)

const isProduction = process.env.NODE_ENV === 'production'
const isV0PreviewIframe =
  process.env.NODE_ENV === 'development' &&
  Boolean(process.env.V0_RUNTIME_URL || process.env.V0_DEV_APP_URL || process.env.V0_SANDBOX_URL)

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: authSchema,
  }),
  baseURL: resolvedBaseUrl,
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },
  trustedOrigins: [
    ...(process.env.BETTER_AUTH_URL ? [process.env.BETTER_AUTH_URL] : []),
    ...(process.env.NEXT_PUBLIC_APP_URL ? [process.env.NEXT_PUBLIC_APP_URL] : []),
    ...(process.env.NODE_ENV === 'development'
      ? [
          'http://localhost:3000',
          ...(process.env.V0_RUNTIME_URL ? [process.env.V0_RUNTIME_URL] : []),
          ...(process.env.V0_DEV_APP_URL ? [process.env.V0_DEV_APP_URL] : []),
          ...(process.env.V0_BUILD_URL ? [process.env.V0_BUILD_URL] : []),
          ...(process.env.V0_SANDBOX_URL ? [process.env.V0_SANDBOX_URL] : []),
        ]
      : []),
    ...(isProduction
      ? [
          ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
          ...(process.env.VERCEL_PROJECT_PRODUCTION_URL
            ? [`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`]
            : []),
        ]
      : []),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await provisionWorkspaceForUser(user)
        },
      },
    },
  },
  advanced: isV0PreviewIframe
    ? {
        defaultCookieAttributes: {
          httpOnly: true,
          sameSite: 'none' as const,
          secure: true,
        },
      }
    : {
        useSecureCookies: isProduction && (resolvedBaseUrl?.startsWith('https://') ?? true),
        defaultCookieAttributes: {
          httpOnly: true,
          sameSite: 'lax' as const,
        },
      },
})
