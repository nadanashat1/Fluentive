/**
 * Test role normalization with all variations
 */

// Import the normalizeRole function (simulate for testing)
function normalizeRole(role) {
  if (!role) return "SALES";
  
  const upper = role.toUpperCase();
  
  // Handle combined roles FIRST (most specific)
  if (upper.includes("SALES") && upper.includes("ADMIN") && upper.includes("MANAGER")) {
    return "SALES_ADMIN_MANAGER";
  }
  
  // Exact match for combined role
  if (upper === "SALES_ADMIN_MANAGER") return "SALES_ADMIN_MANAGER";
  
  // Handle individual roles LAST (more general)
  if (upper.includes("SALES")) return "SALES";
  
  return "SALES"; // default fallback
}

console.log('=== Role Normalization Test ===');

const testCases = [
  // Uppercase variations
  'SALES',
  'SALES_ADMIN_MANAGER',
  'SALES-ADMIN-MANAGER',
  'SALES_ADMIN_MANAGER',
  
  // Lowercase variations
  'sales',
  'sales_admin_manager',
  'sales-admin-manager',
  
  // Mixed case variations
  'Sales',
  'Sales_Admin_Manager',
  'Sales-Admin-Manager',
  
  // Edge cases
  'sales_admin',
  'admin_manager',
  'manager',
  'invalid_role',
  '',
  null,
  undefined
];

testCases.forEach((role, index) => {
  const result = normalizeRole(role);
  const input = role === null || role === undefined ? String(role) : `"${role}"`;
  console.log(`${index + 1}. ${input.padEnd(25)} -> ${result}`);
});

console.log('\n✅ Role Normalization Test Complete');
