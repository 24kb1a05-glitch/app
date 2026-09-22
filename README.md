# LearnPath AI

LearnPath AI is a responsive, cross-platform AI learning application focused on the core workflow: Upload → Understand → Practice → Analyze → Improve → Revise.

## Step 4: database-backed practice

Practice generation reads extracted text from `ExtractedText`, creates deterministic study questions, and persists them in `PracticeQuestion`. Saved questions can be retrieved with:

```bash
curl http://localhost:4000/api/files/<file-id>/questions
```

Generate and persist a session with:

```bash
curl -X POST http://localhost:4000/api/practice/generate \
  -H 'Content-Type: application/json' \
  -d '{"fileId":"<file-id>","questionCount":5,"difficulty":"mixed","mode":"quick"}'
```

## Local development

```bash
npm install
npm run prisma:generate --workspace server
npx prisma migrate deploy --schema prisma/schema.prisma
npm run dev
```

The app starts the frontend at `http://localhost:5173` and the API at `http://localhost:4000`.
