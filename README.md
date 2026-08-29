# ChessMastery

> Created by **Irene Al-Caligo**

A personal chess practice studio with Stockfish play, annotated opening lessons, daily tactics, PGN import/export, and local progress memory.

## Features

- Play against Stockfish at a tunable Elo (800–2200)
- Four annotated opening lines with spaced-repetition mistake tracking
- Daily Fork / Pin / Skewer tactics puzzles with hints and answer reveal
- PGN import and export
- Move history browser with position replay
- All data stored locally in the browser — no account or server required

## Stack

- **Frontend:** React 19, Vite, Tailwind CSS v4
- **Chess engine:** Stockfish 18 (WASM, runs off the UI thread via a Web Worker)
- **Chess logic:** chess.js
- **API server:** Express 5, Node.js
- **Database:** PostgreSQL + Drizzle ORM (optional — the frontend has no DB dependency)
- **Validation:** Zod
- **Monorepo:** pnpm workspaces, TypeScript 5.9

## Project structure

```
artifacts/
  chessmastery/        # React SPA (the main app)
  api-server/          # Express API server
lib/
  api-client-react/    # Generated React Query hooks
  api-spec/            # OpenAPI spec + Orval codegen config
  api-zod/             # Generated Zod schemas
  db/                  # Drizzle ORM schema and client
```

## Getting started

**Prerequisites:** Node.js 20+, pnpm

```bash
pnpm install

pnpm run dev:frontend

pnpm run dev:api
```

The frontend works fully standalone — the API server is only needed if you are building backend features.

## Environment variables

| File | Variable | Default |
|---|---|---|
| `artifacts/chessmastery/.env` | `BASE_PATH` | `/` |
| `artifacts/api-server/.env` | `PORT` | `5000` |
| `artifacts/api-server/.env` | `DATABASE_URL` | *(unset — only needed for DB features)* |

## Key source files

| Path | Description |
|---|---|
| `artifacts/chessmastery/src/App.tsx` | Main app state, mode switching, PGN actions, profile persistence |
| `artifacts/chessmastery/src/components/Board/` | Chessboard UI and square highlighting |
| `artifacts/chessmastery/src/components/Controls/` | Play settings and game controls |
| `artifacts/chessmastery/src/components/Lessons/` | Opening library, lesson panel, daily tactics |
| `artifacts/chessmastery/src/data/openings.ts` | Opening tracks and puzzle positions |
| `artifacts/chessmastery/src/lib/chess.ts` | Legal move helpers and board utilities |
| `artifacts/chessmastery/src/engine/stockfishWorker.js` | Web Worker bridge for Stockfish WASM |

## Other commands

```bash
pnpm run typecheck

pnpm run build

pnpm --filter @workspace/api-spec run codegen

pnpm --filter @workspace/db run push
```

## License

MIT © Irene Al-Caligo
