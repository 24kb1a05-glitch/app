# LearnPath AI database setup

The Prisma schema uses SQLite and reads `DATABASE_URL` from the root `.env` file.

## First-time setup

From the repository root:

```bash
npm install
npm run prisma:generate --workspace server
npm run prisma:migrate --workspace server -- --name init
```

Create a local `.env` file from `.env.example` before starting the server:

```bash
cp .env.example .env
npm run dev
```

## Verify upload and extraction

The upload endpoint now extracts and stores text for TXT, CSV, Markdown, JSON, XML, HTML, PDF, DOCX, and PPTX files. The extracted content is persisted in the `ExtractedText` table and the material is marked `ready`.

```bash
printf 'Newton\'s third law' > /tmp/notes.txt
curl -F 'files=@/tmp/notes.txt;type=text/plain' http://localhost:4000/api/files/upload
curl http://localhost:4000/api/files
```

Use the `id` returned by the upload response to retrieve the stored text:

```bash
curl http://localhost:4000/api/files/<id>/text
```

The upload returns `422` for unsupported formats or files from which no text can be extracted. Failed files are removed from `server/uploads` and are not written to the database.

## Verify the database

Check the API health endpoint:

```bash
curl http://localhost:4000/api/health
```

A working database reports `"database":"connected"`.
