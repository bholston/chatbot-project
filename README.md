# Eli — AI Chatbot by Elite Card Processing

Context-aware AI assistant powered by Next.js, Claude, and ChromaDB.

---

## First-Time Setup

### 1. Clone & install dependencies
```bash
git clone <your-repo-url>
cd chatbot
npm install
```

### 2. Configure environment
```bash
cp .env.example .env.local
# Edit .env.local and fill in your API keys
```

### 3. Start ChromaDB
```bash
npm run docker:up
```
This starts ChromaDB with a persistent Docker volume — data survives restarts.

### 4. Start the dev server
```bash
npm run dev
```

### 5. Ingest knowledge base documents
```bash
npm run ingest
```
This loads everything from `docs/elite/`, `docs/donate/`, and `docs/internal/` into ChromaDB.

---

## Adding New Knowledge Base Documents

1. Drop `.txt`, `.md`, `.pdf`, or `.docx` files into the appropriate `docs/` subfolder:
   - `docs/elite/` — Elite Card Processing merchant chatbot
   - `docs/donate/` — Donate Money Now fundraising chatbot
   - `docs/internal/` — Internal team assistant
2. Commit and push the new file to GitHub
3. On your server, pull the latest and run `npm run ingest`

That's it — Eli will immediately know the new information.

---

## Deployment (Docker Compose)

```bash
# Copy and fill in .env.local on your server
cp .env.example .env.local

# Start everything
docker compose up -d

# Ingest documents (only needed after first deploy or when docs change)
npm run ingest
```

---

## Environment Variables

See `.env.example` for all available options.

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | Your Anthropic API key |
| `CHROMA_URL` | Yes | ChromaDB URL (`http://localhost:8000` local, `http://chroma:8000` in Docker) |
| `CHATBOT_CONTEXT` | Yes | `elite`, `donate`, or `internal` |
| `GHL_API_KEY` | No | Go High Level Private Integration token |
| `GHL_LOCATION_ID` | No | GHL Location ID |
| `GHL_API_VERSION` | No | `v2` (default for `pit-` tokens) |
| `REQUIRE_LEAD_CAPTURE` | No | Set to `false` to skip lead form |
| `INGEST_SECRET` | No | Protect `/api/ingest` with a secret header |

---

## Useful Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run ingest       # Load docs into ChromaDB (server must be running)
npm run docker:up    # Start ChromaDB in background
npm run docker:down  # Stop ChromaDB
npm run docker:logs  # Tail Docker logs
```
