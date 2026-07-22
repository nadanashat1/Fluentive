const fs = require('fs');
const path = require('path');

const srcDir = path.join(process.cwd(), 'src');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(file => {
    const filepath = path.join(dir, file);
    if (fs.statSync(filepath).isDirectory()) {
      walk(filepath, callback);
    } else if (filepath.endsWith('.ts') || filepath.endsWith('.tsx')) {
      callback(filepath);
    }
  });
}

function processFile(filepath) {
  let content = fs.readFileSync(filepath, 'utf8');
  let originalContent = content;

  // Track if we need to add the import
  let needsImport = false;

  // Replace type annotations
  if (content.includes('UserRole')) {
    // Check if it's used as a type
    content = content.replace(/:\s*UserRole/g, ': RoleType');
    content = content.replace(/Record<UserRole,/g, 'Record<RoleType,');
    content = content.replace(/role === UserRole/g, 'role === Roles');
    content = content.replace(/role !== UserRole/g, 'role !== Roles');
    content = content.replace(/userRole !== UserRole/g, 'userRole !== Roles');
    content = content.replace(/UserRole\./g, 'Roles.');
    needsImport = true;
  }

  // Handle specific enum mappings
  content = content.replace(/Roles\.OWNER/g, 'Roles.SUPER_ADMIN');
  content = content.replace(/Roles\.HR_MANAGER/g, 'Roles.HR');
  content = content.replace(/Roles\.SALES_MANAGER/g, 'Roles.SALES');
  content = content.replace(/Roles\.FINANCE_MANAGER/g, 'Roles.FINANCE');
  content = content.replace(/Roles\.MARKETING_MANAGER/g, 'Roles.MARKETING');
  content = content.replace(/Roles\.VIEWER/g, 'Roles.USER');

  // Fix imports
  if (content.includes('import { UserRole') || content.includes('import {') && content.includes('UserRole')) {
    // Remove UserRole from Prisma imports
    content = content.replace(/import\s+{\s*([^}]*?)\s*UserRole(?:.*?)\s*([^}]*?)\s*}\s*from\s*['"]@prisma\/client['"];?/g, (match, before, after) => {
      const remaining = [before, after].map(s => s.replace(/,\s*$/, '').trim()).filter(Boolean).join(', ');
      if (remaining) return `import { ${remaining} } from '@prisma/client';`;
      return '';
    });
    
    // Remove UserRole from domain shared types
    content = content.replace(/import\s+{\s*([^}]*?)\s*UserRole(?:.*?)\s*([^}]*?)\s*}\s*from\s*['"](.*?)shared\/types['"];?/g, (match, before, after, path) => {
      const remaining = [before, after].map(s => s.replace(/,\s*$/, '').trim()).filter(Boolean).join(', ');
      if (remaining) return `import { ${remaining} } from '${path}shared/types';`;
      return '';
    });

    // Remove UserRole from general imports
    content = content.replace(/,\s*UserRole\b|\bUserRole\s*,/g, '');
    content = content.replace(/import\s+{\s*UserRole\s*}\s*from\s*['"][^'"]+['"];?\n?/g, '');
  }

  // Inject the new import if we modified something that needs it
  if (content !== originalContent && needsImport && !filepath.includes('constants\\roles.ts') && !filepath.includes('constants/roles.ts')) {
    if (!content.includes("import { Roles")) {
      const importStatement = `import { Roles, RoleType } from '@/constants/roles';\n`;
      // Insert after the last import, or at top
      const lastImportIndex = content.lastIndexOf('import ');
      if (lastImportIndex !== -1) {
        const nextLineIndex = content.indexOf('\n', lastImportIndex);
        content = content.slice(0, nextLineIndex + 1) + importStatement + content.slice(nextLineIndex + 1);
      } else {
        content = importStatement + content;
      }
    }
  }

  // Remove the old enum declarations in shared types or enums
  if (filepath.endsWith('shared\\types.ts') || filepath.endsWith('shared/types.ts')) {
    content = content.replace(/export enum UserRole {[\s\S]*?}/, '');
  }
  if (filepath.endsWith('types\\enums.ts') || filepath.endsWith('types/enums.ts')) {
    content = content.replace(/export const UserRole = {[\s\S]*?};/, '');
    content = content.replace(/export type UserRole = [^;]+;/, '');
  }

  if (content !== originalContent) {
    fs.writeFileSync(filepath, content, 'utf8');
    console.log(`Updated ${filepath}`);
  }
}

walk(srcDir, processFile);
console.log('Refactoring complete.');
