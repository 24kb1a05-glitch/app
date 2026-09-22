import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import fs from 'node:fs';
import fsPromises from 'node:fs/promises';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import { extractFileText } from './extractText.js';

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
      status: material.processingStatus === 'ready' ? 'ready' : material.processingStatus,
      type: material.fileType.toUpperCase(),
      size: material.fileSize,
    }));

    res.json({ files });
  } catch (error) {
    console.error('Failed to load files from database:', error);
    res.status(500).json({ message: 'Unable to load files' });
  }
});

app.get('/api/files/:id/text', async (req, res) => {
  try {
    const material = await prisma.studyMaterial.findUnique({
      where: { id: req.params.id },
      select: { fileName: true, processingStatus: true, extractedText: { orderBy: { pageNumber: 'asc' }, select: { content: true } } },
    });

    if (!material) {
      res.status(404).json({ message: 'File not found' });
      return;
    }

    res.json({ fileName: material.fileName, status: material.processingStatus, text: material.extractedText.map((part) => part.content).join('\n\n') });
  } catch (error) {
    console.error('Failed to load extracted text:', error);
    res.status(500).json({ message: 'Unable to load extracted text' });
  }
});

app.post('/api/files/upload', upload.array('files', 10), async (req, res) => {
  const uploadedFiles = Array.isArray(req.files) ? req.files : [];

  if (!uploadedFiles.length) {
    res.status(400).json({ message: 'At least one file is required' });
    return;
  }

  try {
    const user = await ensureDemoUser();
    const createdFiles = [];

    for (const file of uploadedFiles) {
      try {
        const text = await extractFileText(file);
        if (!text) throw new Error('No text could be extracted from the file');

        const savedMaterial = await prisma.studyMaterial.create({
          data: {
            userId: user.id,
            fileName: file.originalname,
            fileType: file.mimetype || path.extname(file.originalname).slice(1).toUpperCase() || 'FILE',
            fileSize: file.size,
            subject: 'Uncategorized',
            topic: 'General',
            processingStatus: 'ready',
            storageLocation: file.path,
            extractedText: { create: { content: text } },
          },
        });

        createdFiles.push({ id: savedMaterial.id, originalName: file.originalname, storedName: file.filename, size: file.size, mimetype: file.mimetype, status: savedMaterial.processingStatus, extractedCharacters: text.length });
      } catch (error) {
        await fsPromises.rm(file.path, { force: true });
        throw new Error(`${file.originalname}: ${error instanceof Error ? error.message : 'text extraction failed'}`);
      }
    }

    res.status(201).json({ message: 'Files uploaded and text extracted successfully', files: createdFiles });
  } catch (error) {
    console.error('Upload or extraction failed:', error);
    res.status(422).json({ message: error instanceof Error ? error.message : 'File upload or text extraction failed' });
  }
});

app.post('/api/practice/generate', (req, res) => {
  const { mode = 'weak-topic', questionCount = 10, difficulty = 'mixed' } = req.body ?? {};

  res.json({ mode, questionCount, difficulty, questions: [
    { id: 1, question: 'Which law explains that every action has an equal and opposite reaction?', answer: "Newton's Third Law", explanation: "Newton's Third Law states that every action creates an equal and opposite reaction." },
    { id: 2, question: 'What is the purpose of normalization in a database?', answer: 'Reduce redundancy and improve data integrity', explanation: 'Normalization organizes data to reduce duplication and keep the system consistent.' },
  ] });
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`LearnPath AI server running on http://localhost:${PORT}`);
});
