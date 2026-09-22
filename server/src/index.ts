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
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`),
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

function buildQuestions(text: string, fileName: string, count: number) {
  const passages = text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((passage) => passage.trim())
    .filter((passage) => passage.length >= 20);

  const usablePassages = passages.length ? passages : [text.replace(/\s+/g, ' ').trim()];

  return Array.from({ length: Math.min(count, usablePassages.length) }, (_, index) => ({
    question: `What key point is stated in this passage from ${fileName}?`,
    answer: usablePassages[index],
    explanation: 'This answer is taken directly from the extracted study material.',
    source: fileName,
  }));
}

function normalize(value: string) {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
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
    const user = await ensureDemoUser();
    const materials = await prisma.studyMaterial.findMany({
      where: { userId: user.id },
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

    res.json({
      files: materials.map((material) => ({
        id: material.id,
        name: material.fileName,
        subject: material.subject ?? material.topic ?? 'Uncategorized',
        status: material.processingStatus === 'ready' ? 'ready' : 'processing',
        type: material.fileType.toUpperCase(),
        size: material.fileSize,
      })),
    });
  } catch (error) {
    console.error('Failed to load files:', error);
    res.status(500).json({ message: 'Unable to load files' });
  }
});

app.get('/api/files/:id/text', async (req, res) => {
  try {
    const material = await prisma.studyMaterial.findUnique({
      where: { id: req.params.id },
      select: {
        fileName: true,
        processingStatus: true,
        extractedText: {
          orderBy: { pageNumber: 'asc' },
          select: { content: true },
        },
      },
    });

    if (!material) {
      res.status(404).json({ message: 'File not found' });
      return;
    }

    res.json({
      fileName: material.fileName,
      status: material.processingStatus,
      text: material.extractedText.map((part) => part.content).join('\n\n'),
    });
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
    const createdFiles = [] as Array<{
      id: string;
      originalName: string;
      storedName: string;
      size: number;
      mimetype?: string;
      status: string;
      extractedCharacters: number;
    }>;

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
            extractedText: {
              create: { content: text },
            },
          },
        });

        createdFiles.push({
          id: savedMaterial.id,
          originalName: file.originalname,
          storedName: file.filename,
          size: file.size,
          mimetype: file.mimetype,
          status: savedMaterial.processingStatus,
          extractedCharacters: text.length,
        });
      } catch (error) {
        await fsPromises.rm(file.path, { force: true });
        throw new Error(`${file.originalname}: ${error instanceof Error ? error.message : 'text extraction failed'}`);
      }
    }

    res.status(201).json({
      message: 'Files uploaded and text extracted successfully',
      files: createdFiles,
    });
  } catch (error) {
    console.error('Upload or extraction failed:', error);
    res.status(422).json({ message: error instanceof Error ? error.message : 'File upload or text extraction failed' });
  }
});

app.post('/api/practice/generate', async (req, res) => {
  const { fileId, questionCount = 10, difficulty = 'mixed', mode = 'weak-topic' } = req.body ?? {};

  if (!fileId || typeof fileId !== 'string') {
    res.status(400).json({ message: 'Choose an uploaded file before generating practice.' });
    return;
  }

  try {
    const material = await prisma.studyMaterial.findUnique({
      where: { id: fileId },
      select: {
        fileName: true,
        processingStatus: true,
        extractedText: { select: { content: true } },
      },
    });

    if (!material) {
      res.status(404).json({ message: 'Study material not found.' });
      return;
    }

    const text = material.extractedText.map((part) => part.content).join('\n\n').trim();
    if (!text) {
      res.status(422).json({ message: 'This file has no extracted text to practice.' });
      return;
    }

    const parsedQuestionCount = Number(questionCount);
    const safeQuestionCount = Number.isFinite(parsedQuestionCount)
      ? Math.max(1, Math.min(Math.floor(parsedQuestionCount), 20))
      : 10;

    const generatedQuestions = buildQuestions(text, material.fileName, safeQuestionCount);

    const savedQuestions = await prisma.$transaction(
      generatedQuestions.map((question) =>
        prisma.practiceQuestion.create({
          data: {
            documentId: fileId,
            topic: material.fileName,
            question: question.question,
            options: JSON.stringify([]),
            answer: question.answer,
            explanation: question.explanation,
            difficulty,
          },
        }),
      ),
    );

    res.json({
      mode,
      difficulty,
      fileId,
      fileName: material.fileName,
      status: material.processingStatus,
      questions: savedQuestions.map((question) => ({
        id: question.id,
        question: question.question,
        answer: question.answer,
        explanation: question.explanation,
        source: material.fileName,
      })),
    });
  } catch (error) {
    console.error('Practice generation failed:', error);
    res.status(500).json({ message: 'Unable to generate practice from this file.' });
  }
});

app.get('/api/files/:id/questions', async (req, res) => {
  try {
    const questions = await prisma.practiceQuestion.findMany({
      where: { documentId: req.params.id },
      orderBy: { id: 'asc' },
      select: { id: true, question: true, answer: true, explanation: true, difficulty: true },
    });

    res.json({ questions });
  } catch (error) {
    console.error('Failed to load saved questions:', error);
    res.status(500).json({ message: 'Unable to load saved questions' });
  }
});

app.post('/api/practice/answer', async (req, res) => {
  const { questionId, answer } = req.body ?? {};

  if (!questionId || typeof questionId !== 'string' || typeof answer !== 'string' || !answer.trim()) {
    res.status(400).json({ message: 'questionId and answer are required' });
    return;
  }

  try {
    const user = await ensureDemoUser();
    const question = await prisma.practiceQuestion.findUnique({
      where: { id: questionId },
      select: { id: true, answer: true, topic: true },
    });

    if (!question) {
      res.status(404).json({ message: 'Question not found' });
      return;
    }

    const correct = normalize(answer) === normalize(question.answer);
    const topic = question.topic ?? 'General';

    const result = await prisma.$transaction(async (tx) => {
      await tx.practiceAttempt.create({
        data: {
          userId: user.id,
          questionId,
          answer: answer.trim(),
          correct,
        },
      });

      const existing = await tx.userProgress.findUnique({
        where: {
          userId_topic: {
            userId: user.id,
            topic,
          },
        },
      });

      const totalAnswered = (existing?.totalAnswered ?? 0) + 1;
      const totalCorrect = (existing?.totalCorrect ?? 0) + (correct ? 1 : 0);
      const mastery = totalAnswered ? totalCorrect / totalAnswered : 0;

      const progress = await tx.userProgress.upsert({
        where: {
          userId_topic: {
            userId: user.id,
            topic,
          },
        },
        update: {
          totalAnswered,
          totalCorrect,
          mastery,
          lastUpdated: new Date(),
        },
        create: {
          userId: user.id,
          topic,
          totalAnswered,
          totalCorrect,
          mastery,
        },
      });

      return { progress };
    });

    res.json({
      correct,
      expectedAnswer: question.answer,
      progress: {
        topic,
        mastery: result.progress.mastery,
        totalAnswered: result.progress.totalAnswered,
        totalCorrect: result.progress.totalCorrect,
      },
    });
  } catch (error) {
    console.error('Failed to record answer:', error);
    res.status(500).json({ message: 'Unable to record answer' });
  }
});

app.get('/api/progress', async (_req, res) => {
  try {
    const user = await ensureDemoUser();

    const progress = await prisma.userProgress.findMany({
      where: { userId: user.id },
      orderBy: { lastUpdated: 'desc' },
    });

    res.json({ progress });
  } catch (error) {
    console.error('Failed to load progress:', error);
    res.status(500).json({ message: 'Unable to load progress' });
  }
});

app.get('/api/analytics', async (_req, res) => {
  try {
    const user = await ensureDemoUser();

    const [files, progress, recentAttempts] = await Promise.all([
      prisma.studyMaterial.findMany({
        where: { userId: user.id },
        orderBy: { uploadDate: 'desc' },
        select: {
          id: true,
          fileName: true,
          processingStatus: true,
          uploadDate: true,
        },
      }),
      prisma.userProgress.findMany({
        where: { userId: user.id },
        orderBy: { lastUpdated: 'desc' },
      }),
      prisma.practiceAttempt.findMany({
        where: { userId: user.id },
        orderBy: { answeredAt: 'desc' },
        take: 5,
        select: {
          id: true,
          answer: true,
          correct: true,
          answeredAt: true,
          question: {
            select: { question: true, topic: true },
          },
        },
      }),
    ]);

    const totalAnswered = progress.reduce((sum, item) => sum + item.totalAnswered, 0);
    const totalCorrect = progress.reduce((sum, item) => sum + item.totalCorrect, 0);
    const accuracy = totalAnswered ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
    const averageMastery = progress.length
      ? Math.round((progress.reduce((sum, item) => sum + item.mastery, 0) / progress.length) * 100)
      : 0;

    res.json({
      summary: {
        totalFiles: files.length,
        totalAnswered,
        totalCorrect,
        accuracy,
        averageMastery,
      },
      files: files.map((file) => ({
        id: file.id,
        name: file.fileName,
        status: file.processingStatus === 'ready' ? 'ready' : 'processing',
        uploadedAt: file.uploadDate,
      })),
      progress: progress.map((item) => ({
        id: item.id,
        topic: item.topic,
        mastery: item.mastery,
        totalAnswered: item.totalAnswered,
        totalCorrect: item.totalCorrect,
        lastUpdated: item.lastUpdated,
      })),
      recent: recentAttempts.map((attempt) => ({
        id: attempt.id,
        question: attempt.question.question,
        topic: attempt.question.topic ?? 'General',
        correct: attempt.correct,
        answeredAt: attempt.answeredAt,
      })),
    });
  } catch (error) {
    console.error('Failed to load analytics:', error);
    res.status(500).json({ message: 'Unable to load analytics' });
  }
});

app.get('/api/recommendations', async (_req, res) => {
  try {
    const user = await ensureDemoUser();
    const progress = await prisma.userProgress.findMany({
      where: { userId: user.id },
      orderBy: [{ mastery: 'asc' }, { totalAnswered: 'desc' }],
    });

    const recommendations = progress.map((item) => {
      const masteryPercent = Math.round(item.mastery * 100);
      return {
        topic: item.topic,
        mastery: item.mastery,
        masteryPercent,
        totalAnswered: item.totalAnswered,
        totalCorrect: item.totalCorrect,
        priority: item.mastery < 0.5 ? 'High' : item.mastery < 0.75 ? 'Medium' : 'Low',
        nextAction:
          item.mastery < 0.5
            ? 'Review the core ideas and retest this topic soon.'
            : item.mastery < 0.75
              ? 'Practice a short follow-up set to strengthen recall.'
              : 'Keep the streak going with one quick review pass.',
      };
    });

    res.json({ recommendations });
  } catch (error) {
    console.error('Failed to load recommendations:', error);
    res.status(500).json({ message: 'Unable to load recommendations' });
  }
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`LearnPath AI server running on http://localhost:${PORT}`);
});
