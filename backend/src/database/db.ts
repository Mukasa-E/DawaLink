import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export async function initializeDatabase() {
  // With Prisma + PostgreSQL, schema is managed via migrations
  // Ensure connection works
  await prisma.$connect();
  console.log('Database connected successfully');
}

export default prisma;

