import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import configs & database connections
import { connectMongoDB, prisma } from './config/db';

// Import sub-routers
import authRouter from './routes/auth';
import departmentsRouter from './routes/departments';
import complaintsRouter from './routes/complaints';
import civicUpdatesRouter from './routes/civicUpdates';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON body parsing
app.use(cors());
app.use(express.json({ limit: '15mb' }));

// Mount sub-routers
app.use('/api/auth', authRouter);
app.use('/api/departments', departmentsRouter);
app.use('/api/complaints', complaintsRouter);
app.use('/api/civic-updates', civicUpdatesRouter);

// Bootstrap Server & Database Connections
const bootstrap = async () => {
  // Connect to MongoDB
  await connectMongoDB();

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
  });
};

bootstrap();
