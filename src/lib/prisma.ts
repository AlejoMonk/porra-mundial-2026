import { PrismaClient } from '@/generated/prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const globalForPrisma = globalThis as unknown as { prisma: any }

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) throw new Error('DATABASE_URL is not set')
  // Strip "file:" prefix to get the raw file path
  const filePath = databaseUrl.replace(/^file:/, '')
  const adapter = new PrismaBetterSqlite3({ url: filePath })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new (PrismaClient as any)({ adapter })
}

// Lazy proxy: the real client is only created on first use, not at import time.
// This prevents build-time errors when DATABASE_URL / the volume isn't available yet.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const prisma: any = new Proxy({} as any, {
  get(_target, prop) {
    if (!globalForPrisma.prisma) {
      const client = createPrismaClient()
      if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = client
      return client[prop as string]
    }
    return globalForPrisma.prisma[prop as string]
  },
})
