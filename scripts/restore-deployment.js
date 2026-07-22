#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Restore original package.json
fs.writeFileSync('D:\Fluentive\Fluentive\package.json', '{
  "name": "d-fluency-crm-frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbo",
    "start": "next start",
    "build": "next build",
    "lint": "next lint",
    "diagnose": "node scripts/diagnose-api.js",
    "typecheck": "tsc --noEmit",
    "precommit": "npm run lint -- --max-warnings=0 && npm run typecheck",
    "prepush": "npm run build",
    "vercel-build": "prisma generate && next build",
    "predeploy": "ts-node scripts/pre-deploy.ts",
    "rollback": "ts-node scripts/rollback.ts",
    "test:quick": "echo \'Quick tests not configured\'",
    "test:ci": "jest --passWithNoTests --ci --silent",
    "test:api": "tsx src/tests/api/all-endpoints.test.ts",
    "test:dashboard": "node scripts/test-dashboard-apis.js",
    "test:dashboard:full": "node scripts/dashboard-api-test-runner.js",
    "production:init": "git checkout -b production-stable && git push origin production-stable",
    "production:lock": "git push origin production-stable",
    "performance:gate": "ts-node scripts/performance-gate.ts",
    "security:scan": "npm audit --audit-level=moderate",
    "deploy:staging": "npm run predeploy && vercel --target=staging",
    "deploy:production": "npm run predeploy && vercel --target=production --confirm",
    "ci:full": "npm run lint && npm run typecheck && npm run architecture:check && npm run security:scan && npm run build && npm run performance:gate",
    "postinstall": "prisma generate"
  },
  "dependencies": {
    "@prisma/client": "^7.8.0",
    "@tanstack/react-query": "^5.100.9",
    "@vercel/analytics": "^1.3.0",
    "@vercel/speed-insights": "^1.0.0",
    "bcryptjs": "^2.4.3",
    "chart.js": "^4.5.1",
    "clsx": "^2.1.1",
    "cookie": "^1.1.1",
    "date-fns": "^4.1.0",
    "framer-motion": "^12.38.0",
    "ioredis": "^5.3.2",
    "jsonwebtoken": "^9.0.3",
    "lucide-react": "^0.469.0",
    "next": "^16.2.6",
    "openai": "^4.71.0",
    "otpauth": "^9.2.3",
    "qrcode": "^1.5.4",
    "react": "^19.2.6",
    "react-chartjs-2": "^5.3.1",
    "react-dom": "^19.2.6",
    "react-hot-toast": "^2.6.0",
    "send": "^1.2.1",
    "socket.io-client": "^4.8.3",
    "speakeasy": "^2.0.0",
    "stripe": "^17.4.0",
    "tailwind-merge": "^2.5.0",
    "zod": "^3.25.1"
  },
  "engines": {
    "node": "20.x"
  },
  "packageManager": "npm@10.9.2",
  "description": "Fluentive CRM - Next.js Fullstack Application",
  "prisma": {
    "seed": "node prisma/seed.js"
  },
  "keywords": [
    "nextjs",
    "crm",
    "prisma",
    "react"
  ],
  "author": "",
  "license": "ISC",
  "devDependencies": {
    "@jest/globals": "^30.4.1",
    "@next/bundle-analyzer": "^16.2.6",
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^16.3.2",
    "@types/bcryptjs": "^2.4.6",
    "@types/cookie": "^0.6.0",
    "@types/jest": "^30.0.0",
    "@types/jsonwebtoken": "^9.0.7",
    "@types/node": "^22.19.18",
    "@types/qrcode": "^1.5.5",
    "@types/react": "^19.0.2",
    "@types/react-dom": "^19.0.2",
    "@types/speakeasy": "^2.0.10",
    "@types/stripe": "^8.0.416",
    "autoprefixer": "^10.4.20",
    "dotenv": "^16.4.5",
    "eslint": "^9.17.0",
    "eslint-config-next": "^16.2.6",
    "jest": "^30.4.2",
    "msw": "^2.14.5",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.17",
    "ts-jest": "^29.4.9",
    "ts-node": "^10.9.2",
    "tsx": "^4.21.0",
    "typescript": "^5.7.3",
    "vitest": "^2.1.8"
  }
}');
console.log('📦 Restored original package.json');

// Restore original vercel.json
fs.writeFileSync('D:\Fluentive\Fluentive\vercel.json', '{
  "version": 2,
  "framework": "nextjs",
  "buildCommand": "node scripts/build-optimized.js",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "devCommand": "npm run dev",
  "env": {
    "DATABASE_URL": "@database_url",
    "JWT_SECRET": "@jwt_secret",
    "FRONTEND_URL": "@frontend_url",
    "NEXT_PUBLIC_APP_URL": "@next_public_app_url"
  },
  "build": {
    "env": {
      "NEXT_PUBLIC_APP_URL": "@next_public_app_url",
      "NEXT_PUBLIC_COOKIE_SECURE": "true",
      "NEXT_PUBLIC_COOKIE_SAME_SITE": "strict",
      "NEXT_PUBLIC_CACHE_CONTROL": "public, max-age=31536000, immutable",
      "LOG_LEVEL": "error",
      "NODE_ENV": "production"
    }
  },
  "functions": {
    "memory": 1024,
    "maxDuration": 10
  },
  "regions": ["iad1"],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/$1"
    }
  ]
}
');
console.log('⚙️  Restored original vercel.json');

console.log('✅ Restoration completed!');
