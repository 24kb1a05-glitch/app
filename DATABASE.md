# LearnPath AI database setup

The Prisma schema uses SQLite and reads `DATABASE_URL` from the root `.env` file.

## First-time setup

From the repository root:

```bash
npm install
npm run prisma:generate --workspace server
npm run prisma:migrate --workspace server -- --name init
```

The checked-in migration is located at `prisma/migrations/20260922000000_init`.

Create a local `.env` file from `.env.example` before starting the server:

```bash
cp .env.example .env
npm run dev
```

## Verify the database

Check the API health endpoint:

```bash
curl http://localhost:4000/api/health
```

A working database reports `"database":"connected"`. Then verify the file query:

```bash
curl http://localhost:4000/api/files
```

The first upload creates the demo user (`demo@learnpath.ai`) and persists the uploaded material in `StudyMaterial`.
