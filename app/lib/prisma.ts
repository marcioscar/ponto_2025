import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query'] : [],
  })
}

declare global {
  var __prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.__prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma
}

export { prisma } 