import JSZip from 'jszip';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { Express } from 'express';

type UploadedFile = Express.Multer.File;

const plainTextExtensions = new Set(['.txt', '.csv', '.md', '.json', '.xml', '.html', '.htm']);

function decodeXmlText(value: string) {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

async function extractPowerPointText(buffer: Buffer) {
  const zip = await JSZip.loadAsync(buffer);
  const slideNames = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => Number(a.match(/slide(\d+)/)?.[1]) - Number(b.match(/slide(\d+)/)?.[1]));

  const slides = await Promise.all(
    slideNames.map(async (name, index) => {
      const xml = await zip.files[name].async('text');
      const text = decodeXmlText(xml);
      return text ? `Slide ${index + 1}\n${text}` : '';
    }),
  );

  return slides.filter(Boolean).join('\n\n');
}

export async function extractFileText(file: UploadedFile) {
  const extension = path.extname(file.originalname).toLowerCase();
  const buffer = await fs.readFile(file.path);

  if (plainTextExtensions.has(extension) || file.mimetype.startsWith('text/')) {
    return buffer.toString('utf8').trim();
  }

  if (extension === '.pdf' || file.mimetype === 'application/pdf') {
    const parsed = await pdfParse(buffer);
    return parsed.text.trim();
  }

  if (extension === '.docx' || file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const parsed = await mammoth.extractRawText({ buffer });
    return parsed.value.trim();
  }

  if (extension === '.pptx' || file.mimetype === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
    return extractPowerPointText(buffer);
  }

  throw new Error(`Text extraction is not supported for ${extension || file.mimetype || 'this file type'}`);
}
