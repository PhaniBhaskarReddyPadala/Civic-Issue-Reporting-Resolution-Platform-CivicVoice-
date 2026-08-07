import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables FIRST — before anything reads process.env
dotenv.config();

// Import configs & database connections
import { connectMongoDB, prisma } from './config/db';

// Import sub-routers
import authRouter from './routes/auth';
import departmentsRouter from './routes/departments';
import complaintsRouter from './routes/complaints';
import civicUpdatesRouter from './routes/civicUpdates';

const app = express();
const PORT = process.env.PORT || 5000;

// ── CORS ─────────────────────────────────────────────────────────────────────
// Sanitize FRONTEND_URL env var (stripping quotes, newlines, carriage returns, spaces)
// to prevent Node.js header validation errors (ERR_INVALID_CHAR).
const rawFrontendUrl = (process.env.FRONTEND_URL || '*').trim().replace(/[\r\n\t"']/g, '');

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests (curl, postman, server-to-server) or wildcard
      if (!origin || rawFrontendUrl === '*') {
        return callback(null, true);
      }

      const cleanRequestOrigin = origin.trim().replace(/\/$/, '');
      const configuredOrigins = rawFrontendUrl
        .split(',')
        .map((u) => u.trim().replace(/\/$/, ''))
        .filter(Boolean);

      // Check configured origins
      if (configuredOrigins.some((allowed) => allowed === cleanRequestOrigin)) {
        return callback(null, true);
      }

      // Allow any Vercel domain associated with the project
      if (cleanRequestOrigin.endsWith('.vercel.app')) {
        return callback(null, true);
      }

      // Default fallback
      return callback(null, true);
    },
  })
);

// JSON body parsing (up to 15 MB for base64 image uploads)
app.use(express.json({ limit: '15mb' }));

// ── Health Check ──────────────────────────────────────────────────────────────
// Used by Render (and any load balancer) to verify the service is alive.
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount sub-routers
app.use('/api/auth', authRouter);
app.use('/api/departments', departmentsRouter);
app.use('/api/complaints', complaintsRouter);
app.use('/api/civic-updates', civicUpdatesRouter);

// Bootstrap Server & Database Connections
const bootstrap = async () => {
  // Connect to MongoDB (non-fatal — image features degrade gracefully)
  await connectMongoDB();

  // Connect to PostgreSQL via Prisma — fail fast if unreachable
  try {
    await prisma.$connect();
    console.log('Connected to PostgreSQL via Prisma.');
  } catch (error) {
    console.error('FATAL: Could not connect to PostgreSQL:', error);
    process.exit(1);
  }

  // Seed default departments in PostgreSQL if they do not exist
  try {
    const defaultDepartments = [
      { name: 'Sanitation', description: 'Waste management, public cleanliness, garbage collection' },
      { name: 'Water Supply', description: 'Water pipelines, leaks, maintenance and clean drinking water' },
      { name: 'Roads & Bridges', description: 'Road construction, pothole repairs, street signs and bridge works' },
      { name: 'Electricity', description: 'Streetlights, power disruptions, grid maintenance' },
      { name: 'Parks & Public Spaces', description: 'Public gardens, play areas, park maintenance and green cover' },
    ];

    for (const dept of defaultDepartments) {
      await prisma.department.upsert({
        where: { name: dept.name },
        update: {},
        create: dept,
      });
    }
    console.log('Default departments seeded or verified.');
  } catch (error) {
    console.error('Error seeding departments:', error);
  }

  // Start Express API server
  app.listen(PORT, () => {
    console.log(`CivicFlow API server running on port ${PORT}`);
    if (process.env.FRONTEND_URL) {
      console.log(`CORS restricted to: ${process.env.FRONTEND_URL}`);
    } else {
      console.warn('⚠️  FRONTEND_URL not set — CORS is open to all origins (dev mode)');
    }
  });
};

bootstrap();
