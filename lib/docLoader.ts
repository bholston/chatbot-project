import fs from "fs";
import path from "path";
import { parsePdf, chunkText, TextChunk } from "./pdfLoader";

const SUPPORTED_EXTENSIONS = new Set([".txt", ".md", ".pdf", ".docx"]);

/**
 * Recursively collect all supported document file paths under a directory.
 */
export function walkDirectory(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];

  const results: string[] = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkDirectory(fullPath));
    } else if (SUPPORTED_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      results.push(fullPath);
    }
  }

  return results;
}

/**
 * Extract plain text from a file based on its extension.
 */
export async function extractText(filePath: string): Promise<string> {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".pdf") {
    const buffer = fs.readFileSync(filePath);
    return await parsePdf(buffer);
  }

  if (ext === ".txt" || ext === ".md") {
    return fs.readFileSync(filePath, "utf-8");
  }

  if (ext === ".docx") {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mammoth = require("mammoth") as {
      extractRawText: (opts: { path: string }) => Promise<{ value: string }>;
    };
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }

  return "";
}

/**
 * Load a file and return overlapping text chunks ready for ingestion.
 */
export async function loadFileChunks(
  filePath: string,
  chunkSize?: number,
  overlap?: number
): Promise<TextChunk[]> {
  const text = await extractText(filePath);
  if (!text.trim()) return [];
  return chunkText(text, chunkSize, overlap);
}
