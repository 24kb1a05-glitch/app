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
  return prisma.user.upsert({ where: { email: 'demo@learnpath.ai' }, update: {}, create: { email: 'demo@learnpath.ai', name: 'Demo User' } });
}
function buildQuestions(text: string, fileName: string, count: number) {
  const passages = text.replace(/\s+/g, ' ').split(/(?<=[.!?])\s+/).map((p) => p.trim()).filter((p) => p.length >= 20);
  const usable = passages.length ? passages : [text.replace(/\s+/g, ' ').trim()];
  return Array.from({ length: Math.min(count, usable.length) }, (_, index) => ({ question: `What key point is stated in this passage from ${fileName}?`, answer: usable[index], explanation: 'This answer is taken directly from the extracted study material.', source: fileName }));
}
function normalize(value: string) { return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase(); }

app.get('/api/health', async (_req, res) => { try { await prisma.$queryRaw`SELECT 1`; res.json({ ok: true, message: 'LearnPath AI API is running', database: 'connected' }); } catch { res.json({ ok: true, message: 'LearnPath AI API is running', database: 'unavailable' }); } });
app.get('/api/files', async (_req, res) => {
  try {
    const materials = await prisma.studyMaterial.findMany({ orderBy: { uploadDate: 'desc' }, select: { id: true, fileName: true, fileType: true, fileSize: true, subject: true, topic: true, processingStatus: true } });
    res.json({ files: materials.map((m) => ({ id: m.id, name: m.fileName, subject: m.subject ?? m.topic ?? 'Uncategorized', status: m.processingStatus, type: m.fileType.toUpperCase(), size: m.fileSize })) });
  } catch (error) { console.error('Failed to load files:', error); res.status(500).json({ message: 'Unable to load files' }); }
});
app.get('/api/files/:id/text', async (req, res) => {
  try {
    const material = await prisma.studyMaterial.findUnique({ where: { id: req.params.id }, select: { fileName: true, processingStatus: true, extractedText: { orderBy: { pageNumber: 'asc' }, select: { content: true } } } });
    if (!material) { res.status(404).json({ message: 'File not found' }); return; }
    res.json({ fileName: material.fileName, status: material.processingStatus, text: material.extractedText.map((part) => part.content).join('\n\n') });
  } catch (error) { console.error('Failed to load extracted text:', error); res.status(500).json({ message: 'Unable to load extracted text' }); }
});
app.post('/api/files/upload', upload.array('files', 10), async (req, res) => {
  const uploadedFiles = Array.isArray(req.files) ? req.files : [];
  if (!uploadedFiles.length) { res.status(400).json({ message: 'At least one file is required' }); return; }
  try {
    const user = await ensureDemoUser(); const createdFiles = [];
    for (const file of uploadedFiles) {
      try {
        const text = await extractFileText(file); if (!text) throw new Error('No text could be extracted from the file');
        const saved = await prisma.studyMaterial.create({ data: { userId: user.id, fileName: file.originalname, fileType: file.mimetype || path.extname(file.originalname).slice(1).toUpperCase() || 'FILE', fileSize: file.size, subject: 'Uncategorized', topic: 'General', processingStatus: 'ready', storageLocation: file.path, extractedText: { create: { content: text } } } });
        createdFiles.push({ id: saved.id, originalName: file.originalname, storedName: file.filename, size: file.size, mimetype: file.mimetype, status: saved.processingStatus, extractedCharacters: text.length });
      } catch (error) { await fsPromises.rm(file.path, { force: true }); throw new Error(`${file.originalname}: ${error instanceof Error ? error.message : 'text extraction failed'}`); }
    }
    res.status(201).json({ message: 'Files uploaded and text extracted successfully', files: createdFiles });
  } catch (error) { console.error('Upload or extraction failed:', error); res.status(422).json({ message: error instanceof Error ? error.message : 'File upload or text extraction failed' }); }
});
app.post('/api/practice/generate', async (req, res) => {
  const { fileId, questionCount = 10, difficulty = 'mixed', mode = 'weak-topic' } = req.body ?? {};
  if (!fileId || typeof fileId !== 'string') { res.status(400).json({ message: 'Choose an uploaded file before generating practice.' }); return; }
  try {
    const material = await prisma.studyMaterial.findUnique({ where: { id: fileId }, select: { fileName: true, processingStatus: true, extractedText: { select: { content: true } } } });
    if (!material) { res.status(404).json({ message: 'Study material not found.' }); return; }
    const text = material.extractedText.map((part) => part.content).join('\n\n').trim(); if (!text) { res.status(422).json({ message: 'This file has no extracted text to practice.' }); return; }
    const parsed = Number(questionCount); const count = Number.isFinite(parsed) ? Math.max(1, Math.min(Math.floor(parsed), 20)) : 10;
    const generated = buildQuestions(text, material.fileName, count);
    const saved = await prisma.$transaction(generated.map((q) => prisma.practiceQuestion.create({ data: { documentId: fileId, topic: material.fileName, question: q.question, options: JSON.stringify([]), answer: q.answer, explanation: q.explanation, difficulty } })));
    res.json({ mode, difficulty, fileId, fileName: material.fileName, status: material.processingStatus, questions: saved.map((q) => ({ id: q.id, question: q.question, answer: q.answer, explanation: q.explanation, source: material.fileName })) });
  } catch (error) { console.error('Practice generation failed:', error); res.status(500).json({ message: 'Unable to generate practice from this file.' }); }
});
app.get('/api/files/:id/questions', async (req, res) => {
  try { const questions = await prisma.practiceQuestion.findMany({ where: { documentId: req.params.id }, orderBy: { id: 'asc' }, select: { id: true, question: true, answer: true, explanation: true, difficulty: true } }); res.json({ questions }); }
  catch (error) { console.error('Failed to load saved questions:', error); res.status(500).json({ message: 'Unable to load saved questions' }); }
});
app.post('/api/practice/answer', async (req, res) => {
  const { questionId, answer } = req.body ?? {};
  if (!questionId || typeof questionId !== 'string' || typeof answer !== 'string' || !answer.trim()) { res.status(400).json({ message: 'questionId and answer are required' }); return; }
  try {
    const user = await ensureDemoUser();
    const question = await prisma.practiceQuestion.findUnique({ where: { id: questionId }, select: { id: true, answer: true, topic: true } });
    if (!question) { res.status(404).json({ message: 'Question not found' }); return; }
    const correct = normalize(answer) === normalize(question.answer);
    const topic = question.topic ?? 'General';
    const result = await prisma.$transaction(async (tx) => {
      const attempt = await tx.practiceAttempt.create({ data: { userId: user.id, questionId, answer: answer.trim(), correct } });
      const existing = await tx.userProgress.findUnique({ where: { userId_topic: { userId: user.id, topic } } });
      const totalAnswered = (existing?.totalAnswered ?? 0) + 1;
      const totalCorrect = (existing?.totalCorrect ?? 0) + (correct ? 1 : 0);
      const progress = await tx.userProgress.upsert({ where: { userId_topic: { userId: user.id, topic } }, update: { totalAnswered, totalCorrect, mastery: totalCorrect / totalAnswered, lastUpdated: new Date() }, create: { userId: user.id, topic, totalAnswered, totalCorrect, mastery: totalCorrect / totalAnswered } });
      return { attempt, progress };
    });
    res.json({ correct, expectedAnswer: question.answer, explanation: undefined, progress: { topic, mastery: result.progress.mastery, totalAnswered: result.progress.totalAnswered, totalCorrect: result.progress.totalCorrect } });
  } catch (error) { console.error('Failed to record answer:', error); res.status(500).json({ message: 'Unable to record answer' }); }
});
app.get('/api/progress', async (_req, res) => {
  try { const user = await ensureDemoUser(); const progress = await prisma.userProgress.findMany({ where: { userId: user.id }, orderBy: { lastUpdated: 'desc' } }); res.json({ progress }); }
  catch (error) { console.error('Failed to load progress:', error); res.status(500).json({ message: 'Unable to load progress' }); }
});
process.on('SIGINT', async () => { await prisma.$disconnect(); process.exit(0); });
app.listen(PORT, () => console.log(`LearnPath AI server running on http://localhost:${PORT}`));
