import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const defaultDepartments = [
  { name: 'Sanitation', description: 'Waste management, public cleanliness, garbage collection' },
  { name: 'Water Supply', description: 'Water pipelines, leaks, maintenance and clean drinking water' },
  { name: 'Roads & Bridges', description: 'Road construction, pothole repairs, street signs and bridge works' },
  { name: 'Electricity', description: 'Streetlights, power disruptions, grid maintenance' },
  { name: 'Parks & Public Spaces', description: 'Public gardens, play areas, park maintenance and green cover' },
];

async function seed() {
  console.log('Seeding departments...');
  for (const dept of defaultDepartments) {
    await prisma.department.upsert({
      where: { name: dept.name },
      update: {},
      create: dept,
    });
  }
  console.log('Departments seeded successfully.');

  // Create a default admin/citizen user if not exists
  const existingUser = await prisma.user.findUnique({
    where: { email: 'reddyphani040@gmail.com' },
  });

  if (!existingUser) {
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = await prisma.user.create({
      data: {
        email: 'reddyphani040@gmail.com',
        name: 'Phani Reddy',
        password: hashedPassword,
        role: Role.CITIZEN,
      },
    });
    console.log(`Created default user: ${user.email} with password: password123`);
  } else {
    console.log(`User ${existingUser.email} already exists.`);
  }
}

seed()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
