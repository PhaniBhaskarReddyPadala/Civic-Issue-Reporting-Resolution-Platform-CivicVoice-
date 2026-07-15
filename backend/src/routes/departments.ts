import { Router, Request, Response } from 'express';
import { prisma } from '../config/db';

const router = Router();

// Get all departments
router.get('/', async (req: Request, res: Response) => {
  try {
    const departments = await prisma.department.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(departments);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
