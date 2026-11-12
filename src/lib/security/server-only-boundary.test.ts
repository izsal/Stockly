import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT_DIR = path.resolve(process.cwd())

const SERVER_ONLY_FILES = [
  'src/db/index.ts',
  'src/lib/auth.ts',
  'src/lib/auth-session.ts',
  'src/lib/env.ts',
  'src/lib/logger.ts',
  'src/lib/workspaces/context.ts',
  'src/lib/workspaces/current.ts',
  'src/lib/workspaces/dashboard-auth.ts',
  'src/lib/workspaces/provision.ts',
  'src/services/category.service.ts',
  'src/services/inventory.service.ts',
  'src/services/product.service.ts',
  'src/services/report.service.ts',
  'src/services/supplier.service.ts',
]

const FORBIDDEN_CLIENT_IMPORTS = [
  "@/src/db",
  "@/src/services/",
  "@/src/lib/auth'",
  '@/src/lib/auth"',
  '@/src/lib/env',
  '@/src/lib/workspaces/context',
  '@/src/lib/workspaces/provision',
]

function collectTsFiles(dir: string): string[] {
  const fullDir = path.join(ROOT_DIR, dir)
  if (!fs.existsSync(fullDir)) return []

  const files: string[] = []
  for (const entry of fs.readdirSync(fullDir, { withFileTypes: true })) {
    const rel = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...collectTsFiles(rel))
    } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name) && !/\.test\.ts$/.test(entry.name)) {
      files.push(rel)
    }
  }
  return files
}

describe('server-only database and auth boundaries', () => {
  it('ensures all database, auth, env, and service modules declare import "server-only"', () => {
    for (const relPath of SERVER_ONLY_FILES) {
      const content = fs.readFileSync(path.join(ROOT_DIR, relPath), 'utf8')
      expect(content, `${relPath} must import 'server-only'`).toMatch(/import\s+['"]server-only['"]/)
    }
  })

  it('prevents any Client Component ("use client") from importing server-only modules', () => {
    const sourceFiles = [...collectTsFiles('src'), ...collectTsFiles('app')]
    const clientFiles = sourceFiles.filter((relPath) => {
      const firstLine = fs.readFileSync(path.join(ROOT_DIR, relPath), 'utf8').trimStart()
      return firstLine.startsWith("'use client'") || firstLine.startsWith('"use client"')
    })

    expect(clientFiles.length).toBeGreaterThan(0)

    for (const relPath of clientFiles) {
      const content = fs.readFileSync(path.join(ROOT_DIR, relPath), 'utf8')
      for (const forbidden of FORBIDDEN_CLIENT_IMPORTS) {
        expect(content, `${relPath} must not import ${forbidden}`).not.toContain(forbidden)
      }
    }
  })
})

