import { PrismaClient } from '@prisma/client';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Prisma
export const prisma = new PrismaClient();

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
