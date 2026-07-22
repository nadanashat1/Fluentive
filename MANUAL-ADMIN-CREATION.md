# 🔐 Manual Admin User Creation (Production Safe)

## ⚠️ Why We Don't Use Scripts for Production

- **Security**: Scripts can be re-run accidentally
- **Consistency**: Manual creation ensures proper verification
- **Audit Trail**: Direct database actions are traceable
- **Environment Safety**: No cross-environment contamination

## 📋 Option A: Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard**
   - Navigate to your project
   - Go to Table Editor

2. **Select the User Table**
   - Find and click on the `User` table

3. **Insert New Record**
   ```sql
   INSERT INTO "User" (
     id, 
     name, 
     email, 
     password, 
     role, 
     "isActive", 
     "createdAt", 
     "updatedAt"
   ) VALUES (
     gen_random_uuid(),
     'Production Admin',
     'admin@test.com',
     '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukx.LFvO.', -- Admin123456!
     'ADMIN',
     true,
     NOW(),
     NOW()
   );
   ```

4. **Verify Creation**
   - Check the record appears in the table
   - Confirm `isActive` is true
   - Confirm `role` is 'ADMIN'

## 📋 Option B: Direct SQL Connection

1. **Connect to Production Database**
   ```bash
   # Using psql
   psql "postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres"
   ```

2. **Run the Insert**
   ```sql
   INSERT INTO "User" (
     id, 
     name, 
     email, 
     password, 
     role, 
     "isActive", 
     "createdAt", 
     "updatedAt"
   ) VALUES (
     gen_random_uuid(),
     'Production Admin',
     'admin@test.com',
     '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukx.LFvO.', -- Admin123456!
     'ADMIN',
     true,
     NOW(),
     NOW()
   );
   ```

3. **Verify**
   ```sql
   SELECT id, name, email, role, "isActive", "createdAt" 
   FROM "User" 
   WHERE email = 'admin@test.com';
   ```

## 🔑 Login Credentials

- **Email**: `admin@test.com`
- **Password**: `Admin123456!`
- **IMPORTANT**: Change password immediately after first login

## ✅ Verification Steps

1. **Database Verification**
   ```sql
   -- Check user exists
   SELECT COUNT(*) FROM "User" WHERE email = 'admin@test.com';
   
   -- Check user is active
   SELECT "isActive" FROM "User" WHERE email = 'admin@test.com';
   ```

2. **Application Verification**
   - Go to your Vercel app
   - Try login with the credentials
   - Check browser console for errors
   - Verify Vercel function logs

## 🚨 Security Notes

- **Password Hash**: The provided hash is for `Admin123456!`
- **Change Immediately**: Change password after first successful login
- **Single Use**: This admin account should be used for initial setup only
- **Audit**: Keep a record of when the admin account was created

## 🔄 If You Need to Reset

```sql
-- Delete existing admin
DELETE FROM "User" WHERE email = 'admin@test.com';

-- Recreate with new password hash
INSERT INTO "User" (
  id, 
  name, 
  email, 
  password, 
  role, 
  "isActive", 
  "createdAt", 
  "updatedAt"
) VALUES (
  gen_random_uuid(),
  'Production Admin',
  'admin@test.com',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukx.LFvO.',
  'ADMIN',
  true,
  NOW(),
  NOW()
);
```

---

**This approach eliminates all script-related risks and ensures production safety.**
