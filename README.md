# Codebase — Vibe Coding Companion

A codebase intelligence dashboard that helps developers understand unfamiliar code, audit technical debt, generate documentation, and get refactor suggestions.

## Features

- **Three code input methods**: Paste directly, upload files, or fetch from GitHub
- **Five AI analysis modes**: Explain, Debt Audit, Documentation, Refactors, Architecture Map
- **Streaming AI responses** with real-time feedback
- **Interactive architecture visualization** as SVG node graph
- **Before/after diff viewer** for refactor suggestions
- **Session history** with localStorage persistence
- **Command palette** (Cmd+K) for quick actions
- **Export reports** as markdown

## Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **AI**: Anthropic Claude via Replit AI Integrations
- **Icons**: Lucide React
- **Code highlighting**: Prism.js

## Getting Started

### Option 1: Replit (Recommended)

1. Open this project in Replit
2. Click **Run** — Replit Agent will build the app
3. When Agent asks to connect **Anthropic (Replit managed)**, click **Approve**
4. (Optional) Add `GITHUB_TOKEN` to Replit Secrets for GitHub private repos or higher rate limits
5. The app runs at your Replit project URL — no other config needed

### Option 2: Local Development

```bash
# Install dependencies
npm install
cd client && npm install

# Start dev server (from root)
npm run dev
```

The frontend runs on port 5173, backend on port 3000.

## Usage

1. **Paste code** in the textarea or use Upload/GitHub tabs
2. Click **Analyse** to run a debt audit
3. Use the **Command Bar** (Cmd+K) to access all features:
   - `/explain` — Explain what the code does
   - `/debt` — Run full technical debt audit
   - `/docs` — Generate documentation
   - `/refactor` — Get refactor suggestions with diffs
   - `/map` — Generate architecture map
   - `/focus security` — Focus debt audit on security
   - `/export` — Download full report as markdown

## Keyboard Shortcuts

- `Cmd+K` / `Ctrl+K` — Open command palette
- `↑↓` — Navigate commands
- `Enter` — Select command
- `Esc` — Close palette

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GITHUB_TOKEN` | GitHub API token for private repos | Optional |

## License

MIT
