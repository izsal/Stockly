import 'server-only'

import { randomUUID } from 'node:crypto'

type LogLevel = 'info' | 'warn' | 'error'

const SENSITIVE_KEY_PATTERN =
  /password|passwd|secret|token|cookie|authorization|database_?url|connectionstring/i
const POSTGRES_URL_PATTERN = /postgres(?:ql)?:\/\/[^\s"'`]+/gi
const BEARER_PATTERN = /Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi

export function redactSensitiveText(input: string): string {
  return input
    .replace(POSTGRES_URL_PATTERN, 'postgresql://[REDACTED]')
    .replace(BEARER_PATTERN, 'Bearer [REDACTED]')
}

export function sanitizeLogContext(
  context: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (!context) return undefined

  const sanitized: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(context)) {
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      sanitized[key] = '[REDACTED]'
      continue
    }

    if (typeof value === 'string') {
      sanitized[key] = redactSensitiveText(value)
    } else if (
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      value === null ||
      value === undefined
    ) {
      sanitized[key] = value
    } else if (value instanceof Date) {
      sanitized[key] = value.toISOString()
    } else {
      sanitized[key] = '[Object]'
    }
  }

  return sanitized
}

function serializeError(error: unknown): {
  errorName: string
  errorMessage: string
  errorCode?: string
} {
  if (error instanceof Error) {
    const maybeCode = (error as Error & { code?: unknown }).code
    return {
      errorName: error.name || 'Error',
      errorMessage: redactSensitiveText(error.message || 'Unknown error'),
      ...(typeof maybeCode === 'string' ? { errorCode: maybeCode } : {}),
    }
  }

  if (typeof error === 'string') {
    return {
      errorName: 'Error',
      errorMessage: redactSensitiveText(error),
    }
  }

  return {
    errorName: 'UnknownError',
    errorMessage: 'Unexpected non-error value thrown',
  }
}

function writeLog(
  level: LogLevel,
  scope: string,
  payload: Record<string, unknown>,
) {
  const entry = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    scope,
    ...payload,
  })

  if (level === 'error') {
    console.error(entry)
  } else if (level === 'warn') {
    console.warn(entry)
  } else {
    console.info(entry)
  }
}

export function logServerError(
  scope: string,
  error: unknown,
  context?: Record<string, unknown>,
  correlationId: string = randomUUID(),
): string {
  writeLog('error', scope, {
    correlationId,
    ...serializeError(error),
    ...(context ? { context: sanitizeLogContext(context) } : {}),
  })
  return correlationId
}

export function logServerWarn(
  scope: string,
  message: string,
  context?: Record<string, unknown>,
): void {
  writeLog('warn', scope, {
    message: redactSensitiveText(message),
    ...(context ? { context: sanitizeLogContext(context) } : {}),
  })
}

export function logServerInfo(
  scope: string,
  message: string,
  context?: Record<string, unknown>,
): void {
  writeLog('info', scope, {
    message: redactSensitiveText(message),
    ...(context ? { context: sanitizeLogContext(context) } : {}),
  })
}

