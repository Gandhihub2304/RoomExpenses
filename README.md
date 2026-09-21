# RoomMate – Smart Room & Shared Expense Management

RoomMate helps roommates in shared flats, PGs, hostels, and apartments track
shared expenses, bills, budgets, and settlements — with a clean, fintech-grade
dashboard and full role-based access control (Room Admin vs Roommate).

## Project structure

```
RoomExpenses/
  web/     Next.js + TypeScript + Tailwind CSS + shadcn/ui (frontend, PWA)
  api/     Node.js + Express + TypeScript + Prisma + PostgreSQL (planned)
```

## Status

**Phase 1 (current):** Marketing landing page + authentication UI
(login, register, forgot/reset password, email verification). Dark mode,
responsive layout, and installable PWA groundwork are in place.

**Planned next phases:**
- Backend API (Express + Prisma + PostgreSQL) with real auth (sessions, email
  verification, Google OAuth, rate limiting, RBAC middleware)
- Room management, invitations, member roles
- Expense engine (splits, participants, categories)
- Settlement engine, recurring expenses, bills, budgets
- Real-time notifications (Socket.IO), analytics, receipts/OCR, audit log

## Development

```bash
cd web
npm install
npm run dev       # http://localhost:3000
npm run build     # production build
```

### Environment variables (web)

Create `web/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

## Tech stack

- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS v4, shadcn/ui
  (Base UI primitives), react-hook-form + zod, next-themes, Sonner toasts.
- **Backend (planned):** Node.js, Express, TypeScript, Prisma, PostgreSQL,
  Redis, Socket.IO, S3-compatible object storage.
