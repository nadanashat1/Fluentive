# Fluentive CRM

## About the project

Fluentive is a full-stack CRM for language centers. It brings lead follow-up, sales tracking, course records, and team management into one dashboard, helping staff organize daily work and track prospective students from their first enquiry through the sales process.

The project combines a responsive React interface with backend API routes and a PostgreSQL database. It includes searchable tables, forms, charts, and a sales pipeline.

## Core features

- Lead management: create and edit leads, search and filter records, update statuses, and use bulk actions and export.
- Sales pipeline: organize deals by stage.
- Dashboard and activity tracking: view summary metrics and charts, review activity, and track work time.
- Course and instructor records: browse and manage courses and instructors.
- Team management: manage user accounts and roles.
- Account access: registration with email verification, sign-in, and email-based password reset.

## Main technologies

Next.js, React, TypeScript, Tailwind CSS, Prisma, and PostgreSQL hosted on Supabase. The demo is deployed on Vercel.

## Live demo
https://fluentive-nada.vercel.app

A portfolio demonstration of Fluentive, using a separate demo database with synthetic sample records. Registration is available for exploring the app. Please use test data only and do not enter real customer, employee, or student information.

New accounts require email verification. Password reset is available by email. Demo emails may arrive in Spam; check both your inbox and spam folder.

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
