import { ChromaClient, Collection } from "chromadb";
import { DefaultEmbeddingFunction } from "@chroma-core/default-embed";

let client: ChromaClient | null = null;
const collectionCache = new Map<string, Collection>();
const embedFn = new DefaultEmbeddingFunction();

function getClient(): ChromaClient {
  if (!client) {
    client = new ChromaClient({
      path: process.env.CHROMA_URL ?? "http://localhost:8000",
    });
  }
  return client;
}

export async function getCollection(name: string): Promise<Collection> {
  if (collectionCache.has(name)) return collectionCache.get(name)!;

  const chroma = getClient();
  const col = await chroma.getOrCreateCollection({
    name,
    embeddingFunction: embedFn,
    metadata: { "hnsw:space": "cosine" },
  });
  collectionCache.set(name, col);
  return col;
}

export interface Document {
  id: string;
  text: string;
  metadata: Record<string, string>;
}

export async function addDocuments(
  collectionName: string,
  documents: Document[]
): Promise<void> {
  const col = await getCollection(collectionName);

  await col.add({
    ids: documents.map((d) => d.id),
    documents: documents.map((d) => d.text),
    metadatas: documents.map((d) => d.metadata),
  });
}

export async function queryDocuments(
  collectionName: string,
  queryText: string,
  nResults = 5
): Promise<string[]> {
  try {
    const col = await getCollection(collectionName);

    // ChromaDB throws if you query an empty collection or request more
    // results than documents that exist — check count first.
    const count = await col.count();
    if (count === 0) return [];

    const results = await col.query({
      queryTexts: [queryText],
      nResults: Math.min(nResults, count),
    });

    const docs = results.documents?.[0] ?? [];
    return docs.filter((d): d is string => d !== null);
  } catch (err) {
    // Non-fatal: log and let the chat route continue without RAG context.
    console.warn(
      `[vectorstore] query failed for collection "${collectionName}":`,
      err
    );
    return [];
  }
}

export async function deleteCollection(name: string): Promise<void> {
  const chroma = getClient();
  await chroma.deleteCollection({ name });
  collectionCache.delete(name);
}
