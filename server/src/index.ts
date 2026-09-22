import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import fs from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT ?? 4000);
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

const uploadDir = path.join(process.cwd(), 'server', 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, '_');
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const upload = multer({ storage, limits: { files: 10 } });

async function ensureDemoUser() {
  return prisma.user.upsert({
    where: { email: 'demo@learnpath.ai' },
    update: {},
    create: {
      email: 'demo@learnpath.ai',
      name: 'Demo User',
    },
  });
}

app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, message: 'LearnPath AI API is running', database: 'connected' });
  } catch {
    res.json({ ok: true, message: 'LearnPath AI API is running', database: 'unavailable' });
  }
});

app.get('/api/files', async (_req, res) => {
  try {
    const materials = await prisma.studyMaterial.findMany({
      orderBy: { uploadDate: 'desc' },
      select: {
        id: true,
        fileName: true,
        fileType: true,
        fileSize: true,
        subject: true,
        topic: true,
        processingStatus: true,
      },
    });

    const files = materials.map((material) => ({
      id: material.id,
      name: material.fileName,
      subject: material.subject ?? material.topic ?? 'Uncategorized',
      status: material.processingStatus === 'ready' ? 'ready' : 'processing',
      type: material.fileType.toUpperCase(),
      size: material.fileSize,
    }));

    res.json({ files });
  } catch (error) {
    console.error('Failed to load files from database:', error);
    res.status(500).json({ message: 'Unable to load files' });
  }
});

app.post('/api/files/upload', upload.array('files', 10), async (req, res) => {
  const uploadedFiles = Array.isArray(req.files) ? req.files : [];

  try {
    const user = await ensureDemoUser();

    const createdFiles = await Promise.all(
      uploadedFiles.map(async (file) => {
        const savedMaterial = await prisma.studyMaterial.create({
          data: {
            userId: user.id,
            fileName: file.originalname,
            fileType: file.mimetype || path.extname(file.originalname).slice(1).toUpperCase() || 'FILE',
            fileSize: file.size,
            subject: 'Uncategorized',
            topic: 'General',
            processingStatus: 'processing',
            storageLocation: path.join(uploadDir, file.filename),
          },
        });

        return {
          id: savedMaterial.id,
          originalName: file.originalname,
          storedName: file.filename,
          size: file.size,
          mimetype: file.mimetype,
          status: savedMaterial.processingStatus,
        };
      })
    );

    res.status(201).json({
      message: 'Files uploaded successfully',
      files: createdFiles,
    });
  } catch (error) {
    console.error('Upload failed:', error);
    res.status(500).json({ message: 'File upload failed' });
  }
});

app.post('/api/practice/generate', (req, res) => {
  const { mode = 'weak-topic', questionCount = 10, difficulty = 'mixed' } = req.body ?? {};

  res.json({
    mode,
    questionCount,
    difficulty,
    questions: [
      {
        id: 1,
        question: 'Which law explains that every action has an equal and opposite reaction?',
        answer: "Newton's Third Law",
        explanation: "Newton's Third Law states that every action creates an equal and opposite reaction.",
      },
      {
        id: 2,
        question: 'What is the purpose of normalization in a database?',
        answer: 'Reduce redundancy and improve data integrity',
        explanation: 'Normalization organizes data to reduce duplication and keep the system consistent.',
      },
    ],
  });
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`LearnPath AI server running on http://localhost:${PORT}`);
});
