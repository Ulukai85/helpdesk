# Implementation Plan

## Phase 1 — Project Setup

- Initialize monorepo structure (`/client`, `/server`)
- **Backend:** Node.js + Express + TypeScript (ts-node / tsx for dev)
- **Frontend:** Vite + React + TypeScript
- Set up PostgreSQL database

---

## Phase 2 — Database & Schema

- Initialize Prisma with PostgreSQL
- Define schema:
  - `User` (id, name, email, password hash, role: admin | agent, timestamps)
  - `Session` (for database-backed sessions)
  - `Ticket` (id, subject, body, customerEmail, category, status, timestamps)
- Run initial migration
- Write seed script to create the default admin user

---

## Phase 3 — Authentication

- **Backend:**
  - Password hashing with bcrypt
  - `POST /auth/login` — validate credentials, create session
  - `POST /auth/logout` — destroy session
  - `GET /auth/me` — return current user from session
  - Auth middleware to protect routes
- **Frontend:**
  - Login page
  - Auth context (store current user, expose login/logout)
  - Protected route wrapper (redirect to login if unauthenticated)

---

## Phase 4 — User Management

- **Backend:**
  - `GET /users` — list all users (admin only)
  - `POST /users` — create agent account (admin only)
  - `DELETE /users/:id` — delete user (admin only)
- **Frontend:**
  - Users page (admin only, hidden from agents)
  - Create agent form
  - Users table with delete action

---

## Phase 5 — Ticket Ingestion via Email

- Choose and configure email provider (SendGrid or Mailgun)
- Set up inbound email webhook endpoint (`POST /webhooks/email`)
- Parse incoming email payload → create `Ticket` record (status: Open)
- Secure webhook with signature verification

---

## Phase 6 — Ticket Management (Backend)

- `GET /tickets` — list tickets with filtering (status, category) and sorting
- `GET /tickets/:id` — ticket detail
- `PATCH /tickets/:id` — update status
- Add pagination to list endpoint

---

## Phase 7 — Ticket Management (Frontend)

- Ticket list page with filter controls (status, category) and sortable columns
- Ticket detail page (subject, body, customer email, category, status, timestamps)
- Status update control on detail page

---

## Phase 8 — AI Features

- Set up Anthropic Claude API client (shared service in backend)
- **Auto-classification:** on ticket creation, call Claude to assign category
- **AI Summary:** generate a short summary of the ticket body; store on ticket
- **AI-Suggested Reply:** on demand from the detail page, generate a draft reply using the knowledge base as context
- Store AI outputs on the `Ticket` model (add migration)

---

## Phase 9 — Email Replies

- `POST /tickets/:id/reply` — send a reply via SendGrid/Mailgun API, update ticket status to Resolved
- **Frontend:** reply composer on ticket detail page, pre-populated with AI-suggested reply if available; submit sends the reply

---

## Phase 10 — Dashboard

- **Backend:** `GET /dashboard/stats` — open ticket count, resolved today, breakdown by category
- **Frontend:** Dashboard home page with stat cards and a list of recent open tickets

---

## Phase 11 — Deployment

- Write `Dockerfile` for frontend (static build served by nginx)
- Write `Dockerfile` for backend (Node production build)
- Write `docker-compose.prod.yml` (frontend, backend, PostgreSQL)
- Choose cloud provider and provision server
- Configure environment variables in production
- Set up database migrations on deploy
- Point domain + configure email provider webhooks to production URL
