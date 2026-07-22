# RBAC v2 Migration Guide

## Overview
We've migrated from role-based access control to a permission-based RBAC system following industry best practices.

## 🎯 What Changed

### Before (Role-based)
```typescript
// ❌ Hardcoded role checks
if (hasAdminAccess(user.role)) { ... }
if (hasSalesAccess(user.role)) { ... }
```

### After (Permission-based)
```typescript
// ✅ Flexible permission checks
if (hasPermission(user.role, "users.manage")) { ... }
if (hasPermission(user.role, "leads.read")) { ... }
```

## 📋 New Architecture

### 1. Role Normalization
- **File**: `src/types/canonical-role.ts`
- **Purpose**: Standardizes all role variations to canonical form
- **Usage**: `normalizeRole(role)` → `"SALES"` or `"SALES_ADMIN_MANAGER"`

### 2. Permission Mapping
- **File**: `src/lib/permissions.ts`
- **Purpose**: Single source of truth for role-to-permission mapping
- **Structure**:
```typescript
export const ROLE_PERMISSIONS = {
  SALES: [
    "leads.read",
    "leads.create", 
    "leads.update",
    "users.read",
    "org.read",
    "analytics.view",
  ],
  SALES_ADMIN_MANAGER: [
    // All SALES permissions +
    "leads.delete",
    "users.manage",
    "org.manage",
    "admin.security",
    // ... more
  ],
};
```

### 3. Permission Functions
- **File**: `src/lib/permissions.ts`
- **Core Functions**:
  - `hasPermission(role, permission)` - Single access check
  - `hasAnyPermission(role, permissions[])` - OR logic
  - `hasAllPermissions(role, permissions[])` - AND logic
  - `getRolePermissions(role)` - Get all permissions for role

### 4. UI Layer Utilities
- **File**: `src/lib/ui-user-utils.ts`
- **Purpose**: Safe user data normalization for UI components
- **Functions**:
  - `getNormalizedUser(user)` - Normalized user for display
  - `userHasPermission(user, permission)` - UI-friendly permission check
  - `userCanManageUsers(user)` - Convenience helpers

## 🔄 Migration Steps

### For API Routes
```typescript
// ❌ Old way
import { hasAdminAccess } from '@/types/canonical-role';
if (!hasAdminAccess(user.role)) {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// ✅ New way
import { hasPermission } from '@/lib/permissions';
if (!hasPermission(user.role, "users.manage")) {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
```

### For UI Components
```typescript
// ❌ Old way
import { hasAdminAccess } from '@/types/canonical-role';
const canManageUsers = hasAdminAccess(user?.role);

// ✅ New way
import { userCanManageUsers } from '@/lib/ui-user-utils';
const canManageUsers = userCanManageUsers(user);
```

### For Auth Context
```typescript
// ❌ Old way
user: user ? { ...user, role: normalizeRole(user.role) } : null

// ✅ New way
user: getNormalizedUser(user)
```

## 🎛️ Available Permissions

### Lead Management
- `leads.read` - View leads
- `leads.create` - Create new leads  
- `leads.update` - Edit existing leads
- `leads.delete` - Delete leads

### User Management
- `users.read` - View users
- `users.create` - Create new users
- `users.update` - Edit existing users
- `users.manage` - Full user management (admin)

### Analytics
- `analytics.view` - View analytics dashboards
- `analytics.export` - Export analytics data

### Organization Management
- `org.read` - View organization details
- `org.update` - Edit organization settings
- `org.manage` - Full organization management

### System Administration
- `admin.system` - System administration access
- `admin.security` - Security log access
- `admin.audit` - Audit log access

## 🚨 Breaking Changes

### Deprecated Functions
These functions are marked as deprecated but kept for backward compatibility:
- `hasAdminAccess()` → Use `hasPermission(role, "users.manage")`
- `hasSalesAccess()` → Use `hasPermission(role, "leads.read")`
- `hasManagerAccess()` → Use permission-specific checks

### Type Changes
- User objects in UI layer now have normalized roles
- Permission checks now use string-based permissions instead of role booleans

## 🧪 Testing

Run the RBAC test to verify the system:
```bash
npx ts-node src/test-rbac.ts
```

## 📝 Adding New Permissions

1. Add permission to `Permission` type in `src/lib/permissions.ts`
2. Add permission to appropriate roles in `ROLE_PERMISSIONS`
3. Update API routes to use new permission
4. Add UI helper functions if needed

## 🔍 Migration Checklist

- [ ] Replace `hasAdminAccess()` calls with `hasPermission(role, "users.manage")`
- [ ] Replace `hasSalesAccess()` calls with `hasPermission(role, "leads.read")`
- [ ] Update API route permission checks
- [ ] Update UI component permission checks
- [ ] Replace manual role normalization with `getNormalizedUser()`
- [ ] Test all permission scenarios
- [ ] Update documentation

## 🎯 Benefits

✅ **Scalable**: Add permissions without rewriting role logic  
✅ **Maintainable**: Single source of truth for permissions  
✅ **Type-safe**: Full TypeScript support  
✅ **Flexible**: Complex permission combinations  
✅ **Future-proof**: Easy to extend with new features  

## 🆘 Troubleshooting

### Permission Not Working
1. Check if permission exists in `ROLE_PERMISSIONS`
2. Verify role is normalized correctly
3. Check API route is using `hasPermission()`

### Type Errors
1. Ensure permission strings match `Permission` type
2. Use `as any` for dynamic permission strings
3. Check user object includes `role` field

### UI Issues
1. Use `getNormalizedUser()` for display
2. Use UI helper functions for permission checks
3. Don't mutate user objects directly

---

## 📞 Support

For questions about the RBAC migration:
1. Check this guide first
2. Review `src/lib/permissions.ts` for available permissions
3. Test with `src/test-rbac.ts`
4. Check existing implementation examples in codebase
