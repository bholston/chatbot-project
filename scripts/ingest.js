#!/usr/bin/env node
// Run after adding new docs: npm run ingest
// Requires the Next.js server to be running first.

const BASE_URL = process.env.APP_URL || "http://localhost:3000";
const SECRET = process.env.INGEST_SECRET || "";

async function main() {
  console.log(`Ingesting documents via ${BASE_URL}/api/ingest ...`);

  const headers = { "Content-Type": "application/json" };
  if (SECRET) headers["x-ingest-secret"] = SECRET;

  const res = await fetch(`${BASE_URL}/api/ingest`, {
    method: "POST",
    headers,
  });

  const data = await res.json();

  if (!res.ok) {
    console.error("Ingest failed:", data);
    process.exit(1);
  }

  console.log(`\nCollection: ${data.collection}`);
  console.log(`Files processed: ${data.filesProcessed}`);
  console.log(`Chunks added: ${data.chunksAdded}`);

  if (data.results?.length) {
    console.log("\nDetails:");
    for (const r of data.results) {
      if (r.error) {
        console.error(`  ✗ ${r.file}: ${r.error}`);
      } else {
        console.log(`  ✓ ${r.file}: ${r.chunks} chunks`);
      }
    }
  }
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
