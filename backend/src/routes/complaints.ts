import { Router, Response } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { z } from 'zod';
import { prisma } from '../config/db';
import ComplaintDetails from '../models/ComplaintDetails';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Configure Cloudinary if credentials are present
const isCloudinaryConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// Multer storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Helper: Upload Image
const uploadImage = async (file: Express.Multer.File): Promise<string> => {
  if (isCloudinaryConfigured) {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: 'civicflow' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result?.secure_url || '');
        }
      ).end(file.buffer);
    });
  } else {
    const base64Data = file.buffer.toString('base64');
    return `data:${file.mimetype};base64,${base64Data}`;
  }
};

// 1. Create Complaint (Citizens only)
router.post(
  '/',
  authenticateToken,
  upload.single('image'),
  async (req: AuthRequest, res: Response) => {
    if (!req.user || req.user.role !== 'CITIZEN') {
      return res.status(403).json({ error: 'Only citizens can report complaints' });
    }

    const complaintSchema = z.object({
      title: z.string().min(3),
      description: z.string().min(10),
      category: z.string(),
      lat: z.preprocess((val) => parseFloat(val as string), z.number()),
      lng: z.preprocess((val) => parseFloat(val as string), z.number()),
    });

    try {
      const parsedBody = complaintSchema.parse(req.body);

      const department = await prisma.department.findFirst({
        where: { name: { equals: parsedBody.category, mode: 'insensitive' } },
      });

      const imageUrl = req.file ? await uploadImage(req.file) : '';

      const complaint = await prisma.complaint.create({
        data: {
          title: parsedBody.title,
          category: parsedBody.category,
          lat: parsedBody.lat,
          lng: parsedBody.lng,
          userId: req.user.id,
          departmentId: department?.id || null,
        },
      });

      await ComplaintDetails.create({
        complaintId: complaint.id,
        description: parsedBody.description,
        imageUrl,
      });

      res.status(201).json({
        ...complaint,
        description: parsedBody.description,
        imageUrl,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const messages = error.errors.map((e) => e.message).join(', ');
        return res.status(400).json({ error: messages });
      }
      console.error(error);
      res.status(500).json({ error: error.message || 'Server error' });
    }
  }
);

// 2. Get All/Trending Complaints (Public)
router.get('/', async (req, res: Response) => {
  const { sort, category, status } = req.query;

  try {
    const filters: any = {};
    if (category) filters.category = category as string;
    if (status) filters.status = status as string;

    const complaints = await prisma.complaint.findMany({
      where: filters,
      include: {
        user: { select: { id: true, name: true } },
        officer: { select: { id: true, name: true } },
        votes: true,
        follows: true,
      },
    });

    const complaintIds = complaints.map((c) => c.id);
    const mongoDetails = await ComplaintDetails.find({ complaintId: { $in: complaintIds } });
    const detailsMap = new Map(mongoDetails.map((d) => [d.complaintId, d]));

    const mappedComplaints = complaints.map((c) => {
      const details = detailsMap.get(c.id);
      return {
        id: c.id,
        title: c.title,
        category: c.category,
        status: c.status,
        lat: c.lat,
        lng: c.lng,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        userId: c.userId,
        reporterName: c.user.name,
        officerId: c.officerId,
        officerName: c.officer?.name || null,
        departmentId: c.departmentId,
        votesCount: c.votes.length,
        followsCount: c.follows.length,
        votes: c.votes.map((v) => v.userId),
        follows: c.follows.map((f) => f.userId),
        description: details?.description || '',
        imageUrl: details?.imageUrl || '',
        resolutionImageUrl: details?.resolutionImageUrl || null,
      };
    });

    if (sort === 'trending') {
      mappedComplaints.sort((a, b) => b.votesCount - a.votesCount);
    } else {
      mappedComplaints.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    res.json(mappedComplaints);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Get Officer Assigned Complaints (Officer only)
router.get('/officer/assigned', authenticateToken, async (req: AuthRequest, res: Response) => {
  if (!req.user || req.user.role !== 'OFFICER') {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    const complaints = await prisma.complaint.findMany({
      where: {
        OR: [
          { officerId: req.user.id },
          { departmentId: req.user.departmentId, officerId: null },
        ],
      },
      include: {
        user: { select: { name: true } },
        votes: true,
      },
    });

    const complaintIds = complaints.map((c) => c.id);
    const mongoDetails = await ComplaintDetails.find({ complaintId: { $in: complaintIds } });
    const detailsMap = new Map(mongoDetails.map((d) => [d.complaintId, d]));

    const mapped = complaints.map((c) => {
      const details = detailsMap.get(c.id);
      return {
        id: c.id,
        title: c.title,
        category: c.category,
        status: c.status,
        lat: c.lat,
        lng: c.lng,
        createdAt: c.createdAt,
        reporterName: c.user.name,
        officerId: c.officerId,
        votesCount: c.votes.length,
        description: details?.description || '',
        imageUrl: details?.imageUrl || '',
        resolutionImageUrl: details?.resolutionImageUrl || null,
      };
    });

    res.json(mapped);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Get Specific Complaint Detail
router.get('/:id', async (req, res: Response) => {
  const complaintId = parseInt(req.params.id);
  if (isNaN(complaintId)) {
    return res.status(400).json({ error: 'Invalid complaint ID' });
  }

  try {
    const complaint = await prisma.complaint.findUnique({
      where: { id: complaintId },
      include: {
        user: { select: { id: true, name: true } },
        officer: { select: { id: true, name: true } },
        votes: true,
        follows: true,
      },
    });

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    const details = await ComplaintDetails.findOne({ complaintId });

    res.json({
      id: complaint.id,
      title: complaint.title,
      category: complaint.category,
      status: complaint.status,
      lat: complaint.lat,
      lng: complaint.lng,
      createdAt: complaint.createdAt,
      updatedAt: complaint.updatedAt,
      userId: complaint.userId,
      reporterName: complaint.user.name,
      officerId: complaint.officerId,
      officerName: complaint.officer?.name || null,
      departmentId: complaint.departmentId,
      votesCount: complaint.votes.length,
      followsCount: complaint.follows.length,
      votes: complaint.votes.map((v) => v.userId),
      follows: complaint.follows.map((f) => f.userId),
      description: details?.description || '',
      imageUrl: details?.imageUrl || '',
      resolutionImageUrl: details?.resolutionImageUrl || null,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Toggle Vote (Citizen only)
router.post('/:id/vote', authenticateToken, async (req: AuthRequest, res: Response) => {
  if (!req.user || req.user.role !== 'CITIZEN') {
    return res.status(403).json({ error: 'Only citizens can upvote complaints' });
  }

  const complaintId = parseInt(req.params.id);
  const userId = req.user.id;

  try {
    const existingVote = await prisma.vote.findUnique({
      where: { userId_complaintId: { userId, complaintId } },
    });

    if (existingVote) {
      await prisma.vote.delete({
        where: { id: existingVote.id },
      });
      return res.json({ voted: false, message: 'Upvote removed' });
    } else {
      await prisma.vote.create({
        data: { userId, complaintId },
      });
      return res.json({ voted: true, message: 'Upvote registered' });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Toggle Follow (Citizen only)
router.post('/:id/follow', authenticateToken, async (req: AuthRequest, res: Response) => {
  if (!req.user || req.user.role !== 'CITIZEN') {
    return res.status(403).json({ error: 'Only citizens can follow complaints' });
  }

  const complaintId = parseInt(req.params.id);
  const userId = req.user.id;

  try {
    const existingFollow = await prisma.follow.findUnique({
      where: { userId_complaintId: { userId, complaintId } },
    });

    if (existingFollow) {
      await prisma.follow.delete({
        where: { id: existingFollow.id },
      });
      return res.json({ followed: false, message: 'Unfollowed complaint' });
    } else {
      await prisma.follow.create({
        data: { userId, complaintId },
      });
      return res.json({ followed: true, message: 'Following complaint' });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 7. Update Complaint Status & Upload Resolution Image (Officer only)
router.patch(
  '/:id/status',
  authenticateToken,
  upload.single('resolutionImage'),
  async (req: AuthRequest, res: Response) => {
    if (!req.user || req.user.role !== 'OFFICER') {
      return res.status(403).json({ error: 'Only officers can update complaint status' });
    }

    const complaintId = parseInt(req.params.id);
    const statusSchema = z.object({
      status: z.enum(['PENDING', 'IN_PROGRESS', 'RESOLVED']),
    });

    try {
      const data = statusSchema.parse(req.body);
      const complaint = await prisma.complaint.findUnique({
        where: { id: complaintId },
      });

      if (!complaint) {
        return res.status(404).json({ error: 'Complaint not found' });
      }

      const updatedData: any = { status: data.status };
      if (!complaint.officerId) {
        updatedData.officerId = req.user.id;
      } else if (complaint.officerId !== req.user.id) {
        return res.status(403).json({ error: 'This complaint is assigned to another officer' });
      }

      const updatedComplaint = await prisma.complaint.update({
        where: { id: complaintId },
        data: updatedData,
      });

      let resolutionImageUrl = undefined;
      if (data.status === 'RESOLVED' && req.file) {
        resolutionImageUrl = await uploadImage(req.file);
        await ComplaintDetails.findOneAndUpdate(
          { complaintId },
          { $set: { resolutionImageUrl } },
          { new: true }
        );
      }

      res.json({
        ...updatedComplaint,
        resolutionImageUrl,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;
