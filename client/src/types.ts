export type StudyMaterial = {
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

export type PracticeQuestion = {
  id: string;
  question: string;
  answer: string;
  explanation: string;
  source: string;
  topic: string;
  difficulty: string;
};

export type PracticeSummary = {
  title: string;
  subtitle: string;
  difficulty: string;
  questions: number;
};
