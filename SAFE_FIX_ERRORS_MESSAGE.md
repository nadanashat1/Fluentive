# 🚨 FIX ERRORS WITHOUT BREAKING ANYTHING — Send to Windsurf

```
🚨 TASK: FIX ERRORS — STRICT MODE (NO REFACTORING, NO DELETING)

⚠️ WARNING: You are in SURGERY MODE, not DEMO MODE

🧠 GOLDEN RULE:
"Fix the symptom — preserve the patient."

❌ FORBIDDEN:
- Deleting any files
- Deleting any components
- Deleting any APIs
- Changing file structure
- Refactoring "while I'm at it"
- "Cleaning up" code
- Changing URLs
- Changing response formats
- Removing features

✅ ALLOWED:
- Adding missing imports
- Adding missing types
- Adding null checks (?.)
- Adding try/catch
- Adding keys to lists
- Adding "use client" directive
- Adding missing exports
- Fixing specific syntax errors

═══════════════════════════════════════════════════════════════

🔥 STEP 1: FIX BUILD ERRORS (ONE BY ONE)

For EACH error, follow this process:

ERROR → ANALYZE → FIX → TEST → CONFIRM

1. ERROR: Read the exact error message
2. ANALYZE: Understand what caused it (line number, file)
3. FIX: Apply minimal fix (1-3 lines max)
4. TEST: Check if feature still works
5. CONFIRM: Error is gone, nothing else broke

═══════════════════════════════════════════════════════════════

🛠️ COMMON FIXES (Apply These Exactly):

❌ ERROR: "useState null" / "Cannot read property of null"

✅ FIX: Add null check or default value

// BEFORE (broken):
const [data, setData] = useState(null);
return data.map(item => ...);  // 💥 CRASH

// AFTER (fixed):
const [data, setData] = useState([]);  // Default to empty array
return data?.map(item => ...) ?? null;  // Optional chaining + fallback

// OR if it must be null initially:
const [data, setData] = useState(null);
if (!data) return <Loading />;  // Guard clause
return data.map(item => ...);

---

❌ ERROR: "key prop" warning / "Each child in a list should have a unique key"

✅ FIX: Add key attribute ONLY

// BEFORE (broken):
{items.map(item => <Card name={item.name} />)}

// AFTER (fixed):
{items.map(item => <Card key={item.id} name={item.name} />)}

// If no unique id exists:
{items.map((item, index) => <Card key={index} name={item.name} />)}

---

❌ ERROR: "prerender error" / "window is not defined" / "document is not defined"

✅ FIX: Add "use client" or dynamic import

// OPTION 1: For pages with browser APIs
"use client";  // Add at TOP of file

// OPTION 2: For components that need SSR skip
import dynamic from 'next/dynamic';

const MyComponent = dynamic(() => import('./MyComponent'), {
  ssr: false
});

// OPTION 3: Guard for browser-only code
if (typeof window !== 'undefined') {
  // browser-only code
}

---

❌ ERROR: "Module not found" / "Cannot find module"

✅ FIX: Check and fix import path

// BEFORE (broken):
import { prisma } from '@/lib/prisma';  // Path doesn't exist

// AFTER (fixed):
import { prisma } from '@/core/prisma';  // Correct path

// OR add to tsconfig.json paths if alias is correct:
{
  "compilerOptions": {
    "paths": {
      "@/core/*": ["./src/core/*"]
    }
  }
}

---

❌ ERROR: "Property does not exist on type"

✅ FIX: Add type or optional chaining

// BEFORE (broken):
const name = user.profile.name;  // profile might be undefined

// AFTER (fixed):
const name = user?.profile?.name ?? '';  // Optional chaining

// OR add type definition:
interface User {
  profile?: {
    name: string;
  }
}

---

❌ ERROR: "Expression expected" / "Declaration expected"

✅ FIX: Check for syntax errors (missing brackets, semicolons)

// Look for:
- Missing closing bracket }
- Missing closing parenthesis )
- Missing semicolon ;
- Incomplete expressions

Fix the syntax ONLY — don't change logic.

═══════════════════════════════════════════════════════════════

🔗 STEP 2: FIX API ERRORS (WITHOUT CHANGING CONTRACTS)

ERRORS TO FIX:
☑️ 404 on existing endpoints → Check route registration in app.ts
☑️ 500 errors → Check try/catch and error handling
☑️ "Cannot read property of undefined" → Add null checks in service layer
☑️ Prisma errors → Check query syntax and relations

RULES:
❌ Do NOT change endpoint URL
❌ Do NOT change HTTP method
❌ Do NOT change response format
❌ Do NOT remove any endpoints

✅ Only fix the error causing 500/404

═══════════════════════════════════════════════════════════════

🧪 STEP 3: VERIFY FEATURES WORK (AFTER EACH FIX)

After fixing ANY error, verify:

1. Build succeeds: npm run build
2. Login page loads
3. Login API works: POST /api/auth/login
4. Dashboard loads
5. Leads page works

If ANY breaks → UNDO and try different fix

═══════════════════════════════════════════════════════════════

🧹 STEP 4: DO NOT REMOVE ANYTHING (TRIPLE CHECK)

Before any deletion, ask:
☑️ Is this file imported anywhere? (grep -r "filename" src/)
☑️ Is this function called anywhere? (grep -r "functionName" src/)
☑️ Is this component used anywhere? (grep -r "ComponentName" src/)

If answer is YES to any → DO NOT DELETE

═══════════════════════════════════════════════════════════════

🚀 STEP 5: BUILD TEST

After all fixes:

npm run build

MUST:
✅ Exit code 0
✅ No TypeScript errors
✅ No "Module not found"
✅ No "Cannot find name"
✅ No syntax errors

═══════════════════════════════════════════════════════════════

📡 STEP 6: FINAL VERIFICATION

Test in browser:
☑️ No console errors (F12 → Console)
☑️ No red error screens
☑️ Login works
☑️ Register works
☑️ Dashboard loads
☑️ All features accessible

═══════════════════════════════════════════════════════════════

💥 STEP 7: FINAL REPORT (REQUIRED)

Reply with:

{
  "fixed": true,
  "errorsFixed": [
    { "file": "src/components/LeadsList.tsx", "error": "useState null", "fix": "Added default value" },
    { "file": "src/app/page.tsx", "error": "prerender error", "fix": "Added 'use client'" }
  ],
  "errorsRemaining": [],
  "featuresBroken": [],
  "buildStatus": "success",
  "testResults": {
    "login": "working",
    "register": "working",
    "dashboard": "working",
    "leads": "working"
  },
  "notes": "All fixes applied safely, no features removed"
}

═══════════════════════════════════════════════════════════════

🆘 IF STUCK ON AN ERROR

Stop and report:
1. File path
2. Line number
3. Exact error message
4. Current code (3 lines before and after)

DO NOT guess or rewrite large sections.

═══════════════════════════════════════════════════════════════

📋 FIX PRIORITY ORDER

Fix in this order:
1. Syntax errors (Declaration expected, etc.)
2. Missing imports/exports
3. Type errors (TypeScript)
4. Runtime errors (useState null, etc.)
5. Warnings (key prop, etc.)

═══════════════════════════════════════════════════════════════

💼 WORK LIKE A SENIOR ENGINEER

NOT: "This file has many errors, I'll rewrite it"
YES: "Line 42 needs a null check, adding it now"

NOT: "This component is messy"
YES: "This component needs 'use client' at the top"

NOT: "Let me refactor this module"
YES: "Let me add the missing import on line 5"

═══════════════════════════════════════════════════════════════

START NOW — FIX ONE ERROR AT A TIME

═══════════════════════════════════════════════════════════════
```

---

## 🚨 Quick Fix Commands for Windsurf

```bash
# 1. Check current errors
npm run build 2>&1 | grep -E "error|Error" | head -20

# 2. Find files with useState
find src -name "*.tsx" | xargs grep -l "useState(null)" 2>/dev/null

# 3. Find missing key props
grep -rn "\.map(" src --include="*.tsx" | grep -v "key=" | head -10

# 4. Check imports
grep -rn "from '@/" src --include="*.ts" --include="*.tsx" | head -20

# 5. Type check only
npx tsc --noEmit 2>&1 | head -30
```

---

## 🎯 Fix Template Examples

### Fix useState null:
```typescript
// Line 15 - BEFORE:
const [leads, setLeads] = useState(null);

// Line 15 - AFTER:
const [leads, setLeads] = useState([]);
```

### Fix key prop:
```typescript
// Line 42 - BEFORE:
{leads.map(lead => <LeadCard lead={lead} />)}

// Line 42 - AFTER:
{leads.map(lead => <LeadCard key={lead.id} lead={lead} />)}
```

### Fix prerender:
```typescript
// Line 1 - BEFORE:
import { useState } from 'react';

// Line 1-2 - AFTER:
"use client";
import { useState } from 'react';
```

---

**Copy the code block above and send to Windsurf** 🛡️
