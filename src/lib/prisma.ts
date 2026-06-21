import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function getPrismaClient() {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma
  }

  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    throw new Error('Missing DATABASE_URL environment variable for Prisma')
  }

  const client = new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
  })

  if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = client

  return client
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getPrismaClient(), prop, receiver)
  },
})
