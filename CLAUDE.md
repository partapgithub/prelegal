# Overview  

This is a SaaS product to allow users to draft legal agreements based on templates in the templates directory. The user can carry out AI chat in order to establish what document they want and how to fill in the fields. The available documents are covered in the catalog.json file in the project root, included here:

@catalog.json

See the Implementation Status section at the bottom of this file for what is currently built.

# Development process  

When instructed to build a feature:

Use your Atlassian tools to read the feature instructions from Jira
Develop the feature - do not skip any step from the feature-dev 7 step process
Thoroughly test the feature with unit tests and integration tests and fix any issues
Submit a PR using your github tools

# AI design  

When writing code to make calls to LLMs, use your Cerebras skill to use LiteLLM via OpenRouter to the openrouter/openai/gpt-oss-120b model with Cerebras as the inference provider. You should use Structured Outputs so that you can interpret the results and populate fields in the legal document.

There is an OPENROUTER_API_KEY in the .env file in the project root.

# Technical design

The entire project should be packaged into a Docker container.  
The backend should be in backend/ and be a uv project, using FastAPI.  
The frontend should be in frontend/  
The database should use SQLLite and be created from scratch each time the Docker container is brought up, allowing for a users table with sign up and sign in.  
The frontend is statically built (`next build` with `output: 'export'`, `trailingSlash: true`) and served via FastAPI's catch-all file handler. No Node.js process runs in production.
There should be scripts in scripts/ for:  

# Mac

scripts/start-mac.sh    # Start  
scripts/stop-mac.sh     # Stop  

# Linux

scripts/start-linux.sh  
scripts/stop-linux.sh  

# Windows
scripts/start-windows.ps1  
scripts/stop-windows.ps1  
Backend available at http://localhost:8000 

# Color Scheme

Accent Yellow: #ecad0a  
Blue Primary: #209dd7  
Purple Secondary: #753991 (submit buttons)  
Dark Navy: #032147 (headings)  
Gray Text: #888888

Colors are declared as Tailwind v4 `@theme` tokens in `frontend/src/app/globals.css` and available as utilities: `text-brand-navy`, `bg-brand-purple`, `text-brand-blue`, etc.

# Implementation Status

## PL-3 — Mutual NDA Creator prototype
- Client-side Mutual NDA form with live Markdown preview and print-to-PDF
- No backend, no auth, no AI — pure frontend prototype
- Components: `NdaForm.tsx`, `NdaPreview.tsx`, `lib/generateNda.ts`
- Available at `/nda`

## PL-4 — V1 foundation
- **Backend**: FastAPI uv project in `backend/`. SQLite DB (`prelegal.db`) created fresh on each container start with a `users` table. Endpoints: `POST /api/auth/login` (fake — always succeeds), `GET /api/documents` (serves catalog.json), `GET /api/health`.
- **Frontend**: Login page at `/` (fake — any credentials accepted, navigates to `/dashboard`). Dashboard at `/dashboard` shows all 12 document types from catalog; only Mutual NDA is active, rest show "Coming Soon". Brand color scheme applied throughout.
- **Infrastructure**: Two-stage Dockerfile (Node builder → Python runtime), start/stop scripts for Mac, Linux, Windows. Backend at `http://localhost:8000`.
- **Not yet built**: Real authentication, AI chat, document persistence, document types beyond Mutual NDA.