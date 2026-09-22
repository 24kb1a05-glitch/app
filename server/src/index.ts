import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import fs from 'node:fs';
import path from 'node:path';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT ?? 4000);

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

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, message: 'LearnPath AI API is running' });
});

app.get('/api/files', (_req, res) => {
  res.json({
    files: [
      { id: 'file-1', name: 'Mathematics Chapter 1.pdf', subject: 'Mathematics', status: 'ready' },
      { id: 'file-2', name: 'Physics Notes.pdf', subject: 'Physics', status: 'processing' },
      { id: 'file-3', name: 'DBMS Unit 2.docx', subject: 'DBMS', status: 'ready' },
    ],
  });
});

app.post('/api/files/upload', upload.array('files', 10), (req, res) => {
  const files = Array.isArray(req.files) ? req.files : [];

  const payload = files.map((file) => ({
    originalName: file.originalname,
    storedName: file.filename,
    size: file.size,
    mimetype: file.mimetype,
    status: 'uploaded',
  }));

  res.status(201).json({
    message: 'Files uploaded successfully',
    files: payload,
  });
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

app.listen(PORT, () => {
  console.log(`LearnPath AI server running on http://localhost:${PORT}`);
});
