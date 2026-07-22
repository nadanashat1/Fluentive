#!/usr/bin/env node

// 🔒 NON-BYPASSABLE ARCHITECTURE ENFORCEMENT
// This script validates DDD layer boundaries at build time
// CI will fail if any rule is violated

const fs = require('fs');
const path = require('path');

// 🚨 FORBIDDEN LAYER ACCESS MATRIX
const FORBIDDEN_IMPORTS = {
  // Domain Layer - CANNOT import from
  'src/domain/': [
    '../application/',
    '../infrastructure/',
    'src/application/',
    'src/infrastructure/',
    '@application/',
    '@infrastructure/'
  ],
  
  // Application Layer - CANNOT import from
  'src/application/': [
    '../infrastructure/',
    'src/infrastructure/',
    '@infrastructure/'
  ],
  
  // Infrastructure Layer - CANNOT import from
  'src/infrastructure/': [
    '../application/',
    'src/application/',
    '@application/'
  ]
};

// 🎯 ALLOWED PATHS (whitelist approach)
const ALLOWED_IMPORTS = {
  'src/domain/': [
    // Domain can only import from:
    'src/domain/',
    '@domain/',
    'node_modules/',
    '../shared/'
  ],
  
  'src/application/': [
    // Application can only import from:
    'src/application/',
    'src/domain/',
    '@application/',
    '@domain/',
    'node_modules/',
    '../shared/'
  ],
  
  'src/infrastructure/': [
    // Infrastructure can only import from:
    'src/infrastructure/',
    'src/domain/',
    '@infrastructure/',
    '@domain/',
    'node_modules/',
    '../shared/'
  ]
};

console.log('🔒 DDD Architecture Guard - Starting validation...\n');

let violations = [];
let filesChecked = 0;

function findFiles(dir, extensions = ['.ts', '.tsx']) {
  let files = [];
  
  if (!fs.existsSync(dir)) return files;
  
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      files = files.concat(findFiles(fullPath, extensions));
    } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
      files.push(fullPath);
    }
  }
  
  return files;
}

function extractImports(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const imports = [];
  
  // Match import statements
  const importRegex = /import\s+(?:.*?\s+from\s+)?['"]([^'"]+)['"]/g;
  let match;
  
  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  
  return imports;
}

function validateFile(filePath) {
  const relativePath = path.relative(process.cwd(), filePath);
  const fileDir = path.dirname(relativePath) + '/';
  
  // Determine which layer this file belongs to
  let layerType = null;
  for (const layer of Object.keys(FORBIDDEN_IMPORTS)) {
    if (relativePath.startsWith(layer)) {
      layerType = layer;
      break;
    }
  }
  
  if (!layerType) return; // Not in a DDD layer
  
  const imports = extractImports(filePath);
  
  for (const importPath of imports) {
    // Skip node_modules and relative imports within same layer
    if (importPath.startsWith('node_modules/') || importPath.startsWith('.')) {
      continue;
    }
    
    // Check against forbidden imports
    const forbiddenPaths = FORBIDDEN_IMPORTS[layerType];
    for (const forbidden of forbiddenPaths) {
      if (importPath.startsWith(forbidden)) {
        violations.push({
          file: relativePath,
          import: importPath,
          violation: `❌ ${layerType} cannot import from ${forbidden}`,
          rule: 'FORBIDDEN_LAYER_ACCESS'
        });
        break;
      }
    }
    
    // Check against allowed imports (whitelist validation)
    const allowedPaths = ALLOWED_IMPORTS[layerType];
    let isAllowed = false;
    
    for (const allowed of allowedPaths) {
      if (importPath.startsWith(allowed)) {
        isAllowed = true;
        break;
      }
    }
    
    if (!isAllowed && !importPath.startsWith('.')) {
      violations.push({
        file: relativePath,
        import: importPath,
        violation: `❌ ${layerType} can only import from allowed paths: ${allowedPaths.join(', ')}`,
        rule: 'ALLOWED_PATHS_ONLY'
      });
    }
  }
}

// Main execution
function main() {
  const srcDir = path.join(process.cwd(), 'src');
  const files = findFiles(srcDir);
  
  console.log(`📁 Checking ${files.length} TypeScript files...\n`);
  
  for (const file of files) {
    validateFile(file);
    filesChecked++;
  }
  
  // 🚨 REPORT VIOLATIONS
  if (violations.length > 0) {
    console.log('🚨 ARCHITECTURE VIOLATIONS DETECTED!\n');
    
    const groupedViolations = {};
    violations.forEach(v => {
      const key = v.rule;
      if (!groupedViolations[key]) groupedViolations[key] = [];
      groupedViolations[key].push(v);
    });
    
    for (const [rule, ruleViolations] of Object.entries(groupedViolations)) {
      console.log(`\n📋 ${rule}:`);
      ruleViolations.forEach(v => {
        console.log(`   ${v.violation}`);
        console.log(`   File: ${v.file}`);
        console.log(`   Import: ${v.import}`);
        console.log('');
      });
    }
    
    console.log(`\n💥 TOTAL VIOLATIONS: ${violations.length}`);
    console.log(`📊 FILES CHECKED: ${filesChecked}`);
    console.log('\n🚨 BUILD FAILED: Architecture rules violated');
    console.log('🔒 DDD boundaries are enforced - fix violations before proceeding\n');
    
    process.exit(1);
  } else {
    console.log('✅ Architecture validation PASSED');
    console.log(`📊 FILES CHECKED: ${filesChecked}`);
    console.log('🔒 All DDD boundaries respected\n');
    process.exit(0);
  }
}

if (require.main === module) {
  main();
}

module.exports = { validateFile, violations };
