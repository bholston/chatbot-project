// Import the internal file directly to avoid pdf-parse's test runner code
// which crashes at module load time by trying to read test/data/05-versions-space.pdf
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse/lib/pdf-parse.js") as (
  dataBuffer: Buffer
) => Promise<{ text: string; numpages: number; info: unknown }>;

export interface TextChunk {
  text: string;
  index: number;
}

/**
 * Parse a PDF buffer and return its full text content.
 */
export async function parsePdf(buffer: Buffer): Promise<string> {
  const data = await pdfParse(buffer);
  return data.text;
}

/**
 * Split text into overlapping chunks for embedding.
 * @param text       Full document text
 * @param chunkSize  Target characters per chunk (default 1000)
 * @param overlap    Character overlap between consecutive chunks (default 200)
 */
export function chunkText(
  text: string,
  chunkSize = 1000,
  overlap = 200
): TextChunk[] {
  const chunks: TextChunk[] = [];
  let start = 0;
  let index = 0;

  // Normalise whitespace
  const normalised = text.replace(/\s+/g, " ").trim();

  while (start < normalised.length) {
    const end = Math.min(start + chunkSize, normalised.length);
    const chunk = normalised.slice(start, end).trim();

    if (chunk.length > 0) {
      chunks.push({ text: chunk, index });
      index++;
    }

    if (end === normalised.length) break;
    start = end - overlap;
  }

  return chunks;
}

/**
 * Parse a PDF buffer and return overlapping text chunks ready for ingestion.
 */
export async function loadPdfChunks(
  buffer: Buffer,
  chunkSize?: number,
  overlap?: number
): Promise<TextChunk[]> {
  const text = await parsePdf(buffer);
  return chunkText(text, chunkSize, overlap);
}
