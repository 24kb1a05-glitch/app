import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 4000);
const uploadDir = path.join(process.cwd(), 'server', 'uploads');
const dataDir = path.join(process.cwd(), 'server', 'data');
const storeFile = path.join(dataDir, 'store.json');

const allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin not allowed: ${String(origin)}`));
    },
    credentials: true,
  }),
);
app.use(express.json());

fs.mkdirSync(uploadDir, { recursive: true });
fs.mkdirSync(dataDir, { recursive: true });

if (!fs.existsSync(storeFile)) {
  fs.writeFileSync(storeFile, JSON.stringify({ users: [], materials: [] }, null, 2));
}

type UserRecord = {
  id: string;
  email: string;
  name: string;
  password: string;
  token: string;
  createdAt: string;
};

type StudyMaterialRecord = {
  id: string;
  userId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadDate: string;
  subject: string;
  topic: string;
  processingStatus: 'queued' | 'processing' | 'ready' | 'failed';
  storageLocation: string;
  pages?: number | null;
};

type Store = {
  users: UserRecord[];
  materials: StudyMaterialRecord[];
};

const readStore = (): Store => {
  const raw = fs.readFileSync(storeFile, 'utf8');
  try {
    return JSON.parse(raw) as Store;
  } catch {
    return { users: [], materials: [] };
  }
};

const writeStore = (store: Store) => {
  fs.writeFileSync(storeFile, JSON.stringify(store, null, 2));
};

const authUser = (authorizationHeader?: string): UserRecord | null => {
  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authorizationHeader.replace('Bearer ', '').trim();
  const store = readStore();
  return store.users.find((user) => user.token === token) ?? null;
};

const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const user = authUser(req.headers.authorization);
  if (!user) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }

  (req as express.Request & { user?: UserRecord }).user = user;
  next();
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, '_');
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: { files: 10 },
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, message: 'LearnPath AI API is running' });
});

app.post('/api/auth/signup', (req, res) => {
  const { name, email, password } = req.body ?? {};

  if (!name || !email || !password) {
    res.status(400).json({ error: 'Name, email, and password are required.' });
    return;
  }

  const store = readStore();
  const existingUser = store.users.find((user) => user.email.toLowerCase() === String(email).toLowerCase());

  if (existingUser) {
    res.status(409).json({ error: 'An account with this email already exists.' });
    return;
  }

  const user: UserRecord = {
    id: crypto.randomUUID(),
    email: String(email),
    name: String(name),
    password: String(password),
    token: crypto.randomBytes(24).toString('hex'),
    createdAt: new Date().toISOString(),
  };

  store.users.push(user);
  writeStore(store);

  res.status(201).json({
    token: user.token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  const store = readStore();
  const user = store.users.find((entry) => entry.email.toLowerCase() === String(email).toLowerCase());

  if (!user || user.password !== String(password)) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  user.token = crypto.randomBytes(24).toString('hex');
  writeStore(store);

  res.json({
    token: user.token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  });
});

app.get('/api/me', requireAuth, (req, res) => {
  const user = (req as express.Request & { user?: UserRecord }).user;
  if (!user) {
    res.status(401).json({ error: 'Not authenticated.' });
    return;
  }

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  });
});

app.get('/api/files', requireAuth, (req, res) => {
  const user = (req as express.Request & { user?: UserRecord }).user;
  const store = readStore();

  const files = store.materials.filter((material) => material.userId === user?.id);
  res.json({ files });
});

app.post('/api/files/upload', requireAuth, upload.array('files', 10), (req, res) => {
  const user = (req as express.Request & { user?: UserRecord }).user;
  const files = Array.isArray(req.files) ? req.files : [];
  const store = readStore();

  const records = files.map((file) => {
    const baseName = file.originalname.replace(/\.[^.]+$/, '');
    const extension = path.extname(file.originalname).replace('.', '').toUpperCase() || 'FILE';

    const material: StudyMaterialRecord = {
      id: crypto.randomUUID(),
      userId: user!.id,
      fileName: file.originalname,
      fileType: extension,
      fileSize: file.size,
      uploadDate: new Date().toISOString(),
      subject: 'General',
      topic: baseName,
      processingStatus: 'ready',
      storageLocation: path.join('server', 'uploads', file.filename),
      pages: extension === 'PDF' ? 8 : null,
    };

    store.materials.push(material);
    return material;
  });

  writeStore(store);

  res.status(201).json({
    message: 'Files uploaded successfully',
    files: records,
  });
});

app.delete('/api/files/:id', requireAuth, (req, res) => {
  const user = (req as express.Request & { user?: UserRecord }).user;
  const store = readStore();
  const targetId = req.params.id;

  const index = store.materials.findIndex((material) => material.id === targetId && material.userId === user!.id);
  if (index === -1) {
    res.status(404).json({ error: 'Material not found.' });
    return;
  }

  const [removedMaterial] = store.materials.splice(index, 1);
  const storagePath = path.join(process.cwd(), removedMaterial.storageLocation);
  if (fs.existsSync(storagePath)) {
    fs.unlinkSync(storagePath);
  }

  writeStore(store);
  res.json({ success: true, id: removedMaterial.id });
});

app.post('/api/practice/generate', requireAuth, (req, res) => {
  const user = (req as express.Request & { user?: UserRecord }).user;
  const { fileIds = [], mode = 'weak-topic', questionCount = 10, difficulty = 'mixed' } = req.body ?? {};
  const store = readStore();

  const selectedFiles = store.materials.filter(
    (material) => material.userId === user!.id && fileIds.includes(material.id),
  );

  if (!selectedFiles.length) {
    res.status(400).json({ error: 'Please select at least one study material.' });
    return;
  }

  const questionSeed = selectedFiles.map((file, index) => ({
    id: `${file.id}-${index}`,
    question:
      index % 2 === 0
        ? `Which concept is most strongly covered in ${file.fileName}?`
        : `What is a key takeaway from ${file.topic || file.fileName}?`,
    answer:
      index % 2 === 0
        ? 'The core concept and learning objective of the document.'
        : 'The central idea or formula explained in the material.',
    explanation:
      index % 2 === 0
        ? 'The uploaded material emphasizes the main concept and how it connects to practice questions.'
        : 'The selected file defines the key concept, which is the basis for the generated question.',
    source: file.fileName,
    topic: file.topic || 'General',
    difficulty: difficulty || 'mixed',
  }));

  const generatedQuestions = questionSeed.slice(0, Math.min(Number(questionCount) || 10, 10));

  res.json({
    summary: {
      title: mode === 'weak-topic' ? 'Focus on weak topics' : 'Practice from selected materials',
      subtitle: `Questions based on ${selectedFiles.length} uploaded study file${selectedFiles.length > 1 ? 's' : ''}`,
      difficulty: difficulty || 'Mixed',
      questions: generatedQuestions.length,
    },
    questions: generatedQuestions,
  });
});

app.listen(port, () => {
  console.log(`LearnPath AI server running on http://localhost:${port}`);
});
