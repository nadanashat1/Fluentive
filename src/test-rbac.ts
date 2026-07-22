/**
 * RBAC v2 System Test
 * Verify the new permission-based system works correctly
 */

import { normalizeRole } from '@/types/canonical-role';
import { hasPermission, getRolePermissions, ROLE_PERMISSIONS } from '@/lib/permissions';

// Test cases
console.log('=== RBAC v2 System Test ===');

// Test 1: Role normalization
console.log('\n1. Role Normalization:');
console.log('sales_admin_manager ->', normalizeRole('sales_admin_manager'));
console.log('SALES_ADMIN_MANAGER ->', normalizeRole('SALES_ADMIN_MANAGER'));
console.log('Sales_Admin_Manager ->', normalizeRole('Sales_Admin_Manager'));
console.log('sales ->', normalizeRole('sales'));

// Test 2: Permission checks
console.log('\n2. Permission Checks:');
const testRoles = ['SALES', 'SALES_ADMIN_MANAGER'];
const testPermissions = [
  'leads.read',
  'leads.delete', 
  'users.manage',
  'admin.security'
];

testRoles.forEach(role => {
  console.log(`\nRole: ${role}`);
  testPermissions.forEach(permission => {
    const hasAccess = hasPermission(role, permission as any);
    console.log(`  ${permission}: ${hasAccess ? '✅' : '❌'}`);
  });
});

// Test 3: Permission mapping
console.log('\n3. Role Permission Mapping:');
Object.entries(ROLE_PERMISSIONS).forEach(([role, permissions]) => {
  console.log(`\n${role}:`);
  permissions.forEach(permission => {
    console.log(`  - ${permission}`);
  });
});

// Test 4: Get role permissions
console.log('\n4. Get Role Permissions:');
console.log('SALES permissions:', getRolePermissions('SALES'));
console.log('SALES_ADMIN_MANAGER permissions:', getRolePermissions('SALES_ADMIN_MANAGER'));

console.log('\n=== Test Complete ===');
