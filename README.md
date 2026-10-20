# Fluentive CRM

A full-stack CRM for language centers, built with Next.js and TypeScript. It manages the core operations of a language school - leads, students, users, sessions, and analytics - behind a secure dashboard.

## Features

- Authentication with JWT, registration, password reset, and TOTP-based two-factor authentication (QR code setup)
- Dashboard with analytics, session tracking, user management, and summary views, visualized with Chart.js and Recharts
- Leads module for tracking prospective students
- Drag-and-drop interactions (dnd-kit) and animated UI (Framer Motion)
- AI-assisted features through the OpenAI API
- PostgreSQL database access through Prisma (hosted on Supabase)
- Rate limiting and caching with Redis
- Error monitoring with Sentry, analytics with Vercel Analytics
- Jest test setup, API endpoint test suite, and CI scripts for lint, typecheck, audit, and performance gates

## Tech stack

- Next.js (App Router), React, TypeScript
- Prisma + PostgreSQL (Supabase)
- JWT + OTPAuth for authentication
- Tailwind CSS, Framer Motion, Recharts, react-chartjs-2
- Redis (ioredis), Sentry, OpenAI
- Deployed with Vercel

## Getting started

```bash
npm install
npm run dev
```

The app expects environment variables for the database, JWT secret, and app URL. Copy `.env.example` to `.env` and fill in your own values:

```
DATABASE_URL=        # PostgreSQL connection string
DIRECT_URL=          # direct (non-pooled) connection string
JWT_SECRET=          # generate with: openssl rand -base64 32
NEXT_PUBLIC_APP_URL= # e.g. http://localhost:3000
```

Useful scripts: `npm run typecheck`, `npm run lint`, `npm run test:ci`, `npm run build`.
