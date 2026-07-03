import * as pdfjs from 'pdfjs-dist';
// @ts-expect-error - Vite worker import
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

import type { AttachmentPart } from './gemini-client';

export async function fileToAttachment(file: File): Promise<AttachmentPart | null> {
  // Images → base64 inline data for Gemini vision
  if (file.type.startsWith('image/')) {
    const base64 = await fileToBase64(file);
    return { kind: 'image', mimeType: file.type, data: base64, name: file.name };
  }
  // PDFs → extract text
  if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
    const text = await extractPdfText(file);
    return { kind: 'text', data: text, name: file.name };
  }
  // Text files → read as-is
  if (file.type.startsWith('text/') || /\.(txt|csv|md|json)$/i.test(file.name)) {
    const text = await file.text();
    return { kind: 'text', data: text, name: file.name };
  }
  return null;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const s = reader.result as string;
      resolve(s.split(',')[1] ?? '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function extractPdfText(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buf }).promise;
  let out = '';
  const maxPages = Math.min(pdf.numPages, 20);
  for (let i = 1; i <= maxPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    out += content.items.map((it: any) => it.str).join(' ') + '\n\n';
  }
  return out.trim();
}