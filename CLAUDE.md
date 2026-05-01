# Helpdesk — Claude Instructions

## Project

AI-powered ticket management system. See `projekt-scope.md` for features and decisions, `tech-stack.md` for the chosen stack, and `implementation-plan.md` for the phased roadmap.

## Structure

```
helpdesk/
├── client/   # Vite + React + TypeScript + Tailwind CSS v4 + React Router v7
└── server/   # Node.js + Express 5 + TypeScript (runs via Bun)
```

## Commands

```bash
bun run dev:client    # start Vite dev server on :5173
bun run dev:server    # start Express server on :3000 (with --watch)
bun install           # install all workspace dependencies from root
```

## Conventions

- All API routes are prefixed with `/api`
- The Vite dev server proxies `/api/*` to `http://localhost:3000`
- Environment variables: copy `.env.example` → `.env` in both `client/` and `server/`
- Use Bun as the runtime and package manager (not npm/yarn)
- Use TypeScript throughout
- Always use **Context7 MCP** to fetch current documentation before writing code that involves any library or framework used in this project
