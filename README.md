# LearnPath AI

LearnPath AI is a responsive, cross-platform AI learning application focused on the core workflow: Upload → Understand → Practice → Analyze → Improve → Revise.

This repository is being built incrementally, starting with the foundation for the Phase 1 stack:

- Authentication shell
- Dashboard
- Multiple-file upload experience
- File library and metadata
- Background processing status UI
- Practice generation experience
- Express API foundation for file handling and quiz generation
- Prisma schema for future persistent storage

## Stack

- Frontend: React, Vite, TypeScript, Tailwind CSS, shadcn/ui-inspired components
- Backend: Node.js, Express, TypeScript
- Database: Prisma + SQLite for prototype/development
- File upload: Multer

## Local development

```bash
npm install
npm run dev
```

This starts:

- Frontend at http://localhost:5173
- Backend at http://localhost:4000

## Project structure

```text
client/     React + Vite frontend
server/     Express + TypeScript API
prisma/     Prisma schema for study data
```

## Roadmap

### Phase 1 - Core
- Authentication shell
- Dashboard
- File upload interface
- Multi-file selection and status
- File library/search
- Processing workflow UI
- Basic practice generation

### Phase 2 - AI Learning
- AI quiz generation from content
- Practice experience and scoring
- Knowledge-gap detection
- Personalized learning path

### Phase 3 - Progress & Revision
- Revision scheduler
- Analytics and recommendations
- Progress tracking

### Phase 4 - Cross-platform
- Responsive mobile UI
- PWA support
- Installable app experience
- Cross-device sync

## Notes

The current codebase implements the foundation and the first production-ready upload/practice loop in a clean, extendable structure with comments and mock data to enable fast iteration.
