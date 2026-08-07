import { PrismaClient } from '@prisma/client';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Prisma — use a singleton to avoid exhausting the Neon connection pool.
// With PgBouncer (pgbouncer=true) Prisma must use connection_limit=1 so it doesn't
// try to maintain its own pool on top of PgBouncer's pool.
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
    log: ['error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Cleanly disconnect Prisma on process shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

// Initialize Mongoose
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/civicflow';

export const connectMongoDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully via Mongoose');
  } catch (err) {
    console.error('MongoDB connection error (non-fatal):', err);
    console.warn('⚠️  Server will continue without MongoDB. Complaint image features may be unavailable.');
  }
};
