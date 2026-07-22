#!/usr/bin/env node

/**
 * Minimal deployment script for Vercel Hobby Plan
 * Removes heavy dependencies and features temporarily
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Creating minimal deployment for Vercel Hobby Plan...');

// Backup original files
const packageJsonPath = path.join(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const originalPackageJson = JSON.stringify(packageJson, null, 2);

// Create minimal package.json for deployment
const minimalPackageJson = {
  ...packageJson,
  // Remove heavy dev dependencies
  devDependencies: {
    "@types/node": packageJson.devDependencies["@types/node"],
    "typescript": packageJson.devDependencies["typescript"],
    "autoprefixer": packageJson.devDependencies["autoprefixer"],
    "postcss": packageJson.devDependencies["postcss"],
    "tailwindcss": packageJson.devDependencies["tailwindcss"],
    "eslint": packageJson.devDependencies["eslint"],
    "eslint-config-next": packageJson.devDependencies["eslint-config-next"]
  }
};

// Remove heavy production dependencies temporarily
const heavyDeps = ['@testing-library', 'jest', 'vitest', 'msw', 'framer-motion'];
minimalPackageJson.dependencies = { ...packageJson.dependencies };
heavyDeps.forEach(dep => {
  Object.keys(minimalPackageJson.dependencies).forEach(key => {
    if (key.startsWith(dep)) {
      delete minimalPackageJson.dependencies[key];
    }
  });
});

// Write minimal package.json
fs.writeFileSync(packageJsonPath, JSON.stringify(minimalPackageJson, null, 2));
console.log('📦 Created minimal package.json');

// Create temporary vercel.json for minimal deployment
const vercelJsonPath = path.join(__dirname, '../vercel.json');
const originalVercelJson = fs.readFileSync(vercelJsonPath, 'utf8');

const minimalVercelJson = {
  "version": 2,
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "functions": {
    "memory": 512,
    "maxDuration": 10
  },
  "build": {
    "env": {
      "NODE_OPTIONS": "--max-old-space-size=512",
      "NEXT_TELEMETRY_DISABLED": "1"
    }
  }
};

fs.writeFileSync(vercelJsonPath, JSON.stringify(minimalVercelJson, null, 2));
console.log('⚙️  Created minimal vercel.json');

// Create restore script
const restoreScript = `#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Restore original package.json
fs.writeFileSync('${packageJsonPath}', '${originalPackageJson.replace(/'/g, "\\'")}');
console.log('📦 Restored original package.json');

// Restore original vercel.json
fs.writeFileSync('${vercelJsonPath}', '${originalVercelJson.replace(/'/g, "\\'")}');
console.log('⚙️  Restored original vercel.json');

console.log('✅ Restoration completed!');
`;

fs.writeFileSync(path.join(__dirname, 'restore-deployment.js'), restoreScript);
console.log('📝 Created restore script');

console.log('✅ Minimal deployment preparation completed!');
console.log('🚀 Now run: vercel --prod');
console.log('🔄 After deployment, run: node scripts/restore-deployment.js');
