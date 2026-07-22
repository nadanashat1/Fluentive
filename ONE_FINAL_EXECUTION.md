# 🚀 ONE FINAL EXECUTION — System Stabilization

```
🚀 FINAL SYSTEM FIX & STABILIZATION ORDER

🎯 OBJECTIVE:
Make the project BUILD + RUN + DEPLOY STABLE.
No refactoring. No new features. No architecture changes.

────────────────────────────

🧠 TASK MODE: SYSTEM STABILITY ONLY

1. Scan entire project for ALL build/runtime errors
2. Identify ROOT CAUSES (not file-by-file fixes)
3. Apply GLOBAL fixes only (pattern-based fixes)
4. Ensure Next.js build passes with ZERO errors
5. Ensure all API routes work without crashes
6. Ensure Prisma + database works correctly
7. Ensure no SSR/client boundary crashes remain

────────────────────────────

🚫 STRICT RULES:

DO NOT:
- Delete modules or folders
- Rewrite architecture
- Add features
- Refactor unrelated code
- Fix one file at a time repeatedly

DO:
- Fix root causes that affect multiple files
- Apply pattern-based fixes globally
- Verify system-wide after each fix

────────────────────────────

🔍 EXECUTION STEPS:

STEP 1: SCAN
Run: npm run build
Capture all errors. Group by root cause.

STEP 2: IDENTIFY ROOT CAUSES
Common patterns:
- SSR boundary (useState in server components)
- Import path mismatches (@/lib vs @/core)
- Missing "use client" directives
- Template files in build
- Prisma client duplication

STEP 3: GLOBAL FIXES
Apply one fix pattern → resolves multiple files.

STEP 4: VERIFY BUILD
npm run build must pass with ZERO errors.

STEP 5: VERIFY RUNTIME
Test full flow: register → login → CRUD → logout

STEP 6: VERIFY DEPLOY
All env vars set. All routes working. No crashes.

────────────────────────────

🧪 FINAL VERIFICATION:

Run full flow test:
☑️ register user
☑️ login user
☑️ fetch leads
☑️ create lead
☑️ update lead
☑️ delete lead

ALL MUST WORK

────────────────────────────

🏗 BUILD CHECK:

Run: npm run build

Must result in:
✔ no TypeScript errors
✔ no SSR errors
✔ no missing module errors
✔ exit code 0

────────────────────────────

📦 OUTPUT REQUIRED:

Return final report:

{
  "buildStatus": "passed",
  "runtimeStatus": "stable",
  "apiStatus": "all working",
  "rootCausesFixed": [
    "SSR boundary - added use client to 15 files",
    "Import paths - updated @/lib to @/core globally",
    "Template exclusion - removed _templates from build"
  ],
  "criticalIssues": [],
  "readyForDeployment": true
}

────────────────────────────

✅ DONE.
```

---

**Copy the code block above and send to Windsurf ONCE.**

**Do not send any additional messages after this.**

When build is stable, say: **"deployment ready"**
