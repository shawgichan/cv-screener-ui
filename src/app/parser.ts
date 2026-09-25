import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Set worker source for pdf.js
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

export async function extractTextFromFile(file: File): Promise<string> {
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  let text = '';
  if (extension === 'pdf') {
    text = await extractTextFromPDF(file);
  } else if (extension === 'docx') {
    text = await extractTextFromDOCX(file);
  } else {
    throw new Error('Unsupported file type');
  }

  // Assuming ~5 chars per word, 25,000 chars is roughly 5,000 words.
  // Standard resumes should easily fit in this bound.
  if (text.length > 25000) {
    throw new Error('Document is too long to be a standard resume (exceeds character limit).');
  }

  return text;
}

async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: any) => item.str)
      .join(' ');
    text += pageText + '\n';
  }
  
  if (text.trim().length < 100) {
    throw new Error('Scanned/image-based PDFs are not supported in the free beta. Please upload a text-based document.');
  }
  
  return text;
}

async function extractTextFromDOCX(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}
