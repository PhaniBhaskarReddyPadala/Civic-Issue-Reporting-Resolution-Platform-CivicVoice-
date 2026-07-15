import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Publish Civic Update (Officers only)
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  if (!req.user || req.user.role !== 'OFFICER') {
    return res.status(403).json({ error: 'Only officers can publish civic updates' });
  }

  const updateSchema = z.object({
    title: z.string().min(5),
    content: z.string().min(10),
    type: z.enum([
      'Road construction',
      'Water supply maintenance',
      'Power shutdown',
      'New bridge opening',
      'Road closure',
      'Park renovation',
    ]),
  });

  try {
    const data = updateSchema.parse(req.body);

    const civicUpdate = await prisma.civicUpdate.create({
      data: {
        title: data.title,
        content: data.content,
        type: data.type,
        officerId: req.user.id,
      },
      include: {
        officer: { select: { name: true } },
      },
    });

    res.status(201).json(civicUpdate);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

// Read Civic Updates (Public)
router.get('/', async (req, res: Response) => {
  try {
    const updates = await prisma.civicUpdate.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        officer: { select: { name: true, department: { select: { name: true } } } },
      },
    });

    const mapped = updates.map((u) => ({
      id: u.id,
      title: u.title,
      content: u.content,
      type: u.type,
      createdAt: u.createdAt,
      officerName: u.officer.name,
      departmentName: u.officer.department?.name || 'General',
    }));

    res.json(mapped);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
