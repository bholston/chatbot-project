import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { randomUUID } from "crypto";
import { getContextConfig } from "@/lib/chatbotContext";
import { walkDirectory, loadFileChunks } from "@/lib/docLoader";
import { addDocuments } from "@/lib/vectorstore";

/**
 * POST /api/ingest
 *
 * Admin-only endpoint. Scans /docs/{context} folder and ingests all supported
 * documents (.txt, .md, .pdf, .docx) into the context's ChromaDB collection.
 *
 * Requires the X-Ingest-Key header to match INGEST_SECRET env var (if set).
 */
export async function POST(req: NextRequest) {
  try {
    // Optional secret key guard for the admin endpoint
    const secret = process.env.INGEST_SECRET;
    if (secret) {
      const provided = req.headers.get("x-ingest-key");
      if (provided !== secret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const ctx = getContextConfig();
    const contextKey = process.env.CHATBOT_CONTEXT ?? "elite";

    // Docs live at <project-root>/docs/<context>/
    const docsDir = path.join(process.cwd(), "docs", contextKey);
    const filePaths = walkDirectory(docsDir);

    if (filePaths.length === 0) {
      return NextResponse.json({
        success: true,
        message: `No documents found in docs/${contextKey}/`,
        filesProcessed: 0,
        chunksAdded: 0,
      });
    }

    let totalChunks = 0;
    const results: { file: string; chunks: number; error?: string }[] = [];

    for (const filePath of filePaths) {
      const filename = path.relative(docsDir, filePath).replace(/\\/g, "/");
      try {
        const chunks = await loadFileChunks(filePath);

        if (chunks.length === 0) {
          results.push({ file: filename, chunks: 0, error: "No text extracted" });
          continue;
        }

        const docId = randomUUID();
        const safeName = filename.replace(/[^a-zA-Z0-9._/-]/g, "_");

        await addDocuments(
          ctx.collectionName,
          chunks.map((chunk) => ({
            id: `${docId}-chunk-${chunk.index}`,
            text: chunk.text,
            metadata: {
              source: safeName,
              docId,
              chunkIndex: String(chunk.index),
            },
          }))
        );

        totalChunks += chunks.length;
        results.push({ file: filename, chunks: chunks.length });
      } catch (err) {
        results.push({
          file: filename,
          chunks: 0,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      success: true,
      collection: ctx.collectionName,
      filesProcessed: filePaths.length,
      chunksAdded: totalChunks,
      results,
    });
  } catch (error) {
    console.error("Ingest API error:", error);
    return NextResponse.json(
      { error: "Failed to ingest documents. Ensure ChromaDB is running." },
      { status: 500 }
    );
  }
}
