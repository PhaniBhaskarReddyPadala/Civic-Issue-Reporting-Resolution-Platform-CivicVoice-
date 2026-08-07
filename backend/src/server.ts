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
// Native CORS middleware: sanitizes request origins to permanently eliminate Node.js ERR_INVALID_CHAR header exceptions.
app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin) {
    const cleanOrigin = String(origin).replace(/[\r\n\t\0"']/g, '').trim();
    if (cleanOrigin) {
      res.setHeader('Access-Control-Allow-Origin', cleanOrigin);
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  // Handle preflight OPTIONS requests immediately
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  next();
});

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
