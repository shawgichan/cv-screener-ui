# CV Screener — Frontend

Next.js frontend for the Batch CV Screener tool. Parses PDF and DOCX resumes client-side, sends extracted text to the Go backend for AI-powered scoring.

## Architecture

- **Client-side parsing**: PDF (pdf.js) and DOCX (mammoth.js) files are parsed entirely in the browser — no binary files are sent to the server
- **Scanned PDF detection**: Documents with < 100 extractable characters are rejected with a clear message
- **Design system**: Material-derived tokens, teal accent, Inter typeface

## Getting Started

```bash
npm install
npm run dev
```

Set `NEXT_PUBLIC_API_URL` to point to the backend (defaults to `http://localhost:8083`).

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8083` | Backend API URL |

## Data Handling

CVs are parsed in-browser. Only extracted plain text is sent to the backend API for scoring. No binary files or candidate documents are transmitted to or stored on any server.
