import type { ZodError } from 'zod'

export type DomainErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'INSUFFICIENT_STOCK'
  | 'CONFLICT'

const STATUS_CODES: Record<DomainErrorCode, number> = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION_ERROR: 400,
  INSUFFICIENT_STOCK: 409,
  CONFLICT: 409,
}

export class DomainError extends Error {
  readonly code: DomainErrorCode
  readonly statusCode: number
  readonly fieldErrors?: Record<string, string[] | undefined>

  constructor(
    code: DomainErrorCode,
    message: string,
    fieldErrors?: Record<string, string[] | undefined>,
  ) {
    super(message)
    this.name = 'DomainError'
    this.code = code
    this.statusCode = STATUS_CODES[code]
    this.fieldErrors = fieldErrors
  }
}

export function isDomainError(error: unknown): error is DomainError {
  return error instanceof DomainError
}

export function validationErrorFromZod(
  error: ZodError,
  message = 'Periksa kembali data yang dimasukkan.',
) {
  return new DomainError('VALIDATION_ERROR', message, error.flatten().fieldErrors)
}

type PostgresErrorLike = {
  code?: string
  constraint?: string
  cause?: PostgresErrorLike
}

function extractPgError(error: unknown): PostgresErrorLike | null {
  if (!error || typeof error !== 'object') return null
  const candidate = error as PostgresErrorLike
  if (typeof candidate.code === 'string') return candidate
  if (candidate.cause && typeof candidate.cause === 'object') {
    return extractPgError(candidate.cause)
  }
  return null
}

export function mapDatabaseError(
  error: unknown,
  constraintMessages: Record<string, string> = {},
): never {
  if (isDomainError(error)) throw error

  const pgError = extractPgError(error)
  if (pgError?.code === '23505') {
    const message =
      (pgError.constraint && constraintMessages[pgError.constraint]) ??
      'Data yang dimasukkan sudah terdaftar.'
    throw new DomainError('CONFLICT', message)
  }

  if (pgError?.code === '23503') {
    const message =
      (pgError.constraint && constraintMessages[pgError.constraint]) ??
      'Referensi data tidak ditemukan di ruang kerja ini.'
    throw new DomainError('VALIDATION_ERROR', message)
  }

  if (pgError?.code === '23514') {
    throw new DomainError('VALIDATION_ERROR', 'Nilai data tidak memenuhi aturan yang berlaku.')
  }

  throw error
}

