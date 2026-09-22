-- Add file metadata, study sessions, and weak-topic tracking.
CREATE TABLE "FileMetadata" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "documentId" TEXT NOT NULL UNIQUE,
  "mimeType" TEXT,
  "extension" TEXT,
  "checksum" TEXT,
  "pageCount" INTEGER,
  "characterCount" INTEGER,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FileMetadata_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "StudyMaterial" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "StudySession" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "mode" TEXT NOT NULL DEFAULT 'weak-topic',
  "difficulty" TEXT NOT NULL DEFAULT 'mixed',
  "status" TEXT NOT NULL DEFAULT 'active',
  "questionCount" INTEGER NOT NULL DEFAULT 0,
  "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" DATETIME,
  CONSTRAINT "StudySession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "WeakTopic" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "topic" TEXT NOT NULL,
  "mastery" REAL NOT NULL DEFAULT 0,
  "priority" TEXT NOT NULL DEFAULT 'medium',
  "reviewCount" INTEGER NOT NULL DEFAULT 0,
  "lastReviewedAt" DATETIME,
  "nextReviewAt" DATETIME,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WeakTopic_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

ALTER TABLE "PracticeQuestion" ADD COLUMN "sessionId" TEXT REFERENCES "StudySession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "FileMetadata_documentId_idx" ON "FileMetadata"("documentId");
CREATE INDEX "StudySession_userId_startedAt_idx" ON "StudySession"("userId", "startedAt");
CREATE INDEX "PracticeQuestion_sessionId_idx" ON "PracticeQuestion"("sessionId");
CREATE UNIQUE INDEX "WeakTopic_userId_topic_key" ON "WeakTopic"("userId", "topic");
CREATE INDEX "WeakTopic_userId_priority_idx" ON "WeakTopic"("userId", "priority");
