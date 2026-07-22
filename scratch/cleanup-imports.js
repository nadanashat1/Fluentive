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

  // Fix dangling commas
  content = content.replace(/{\s*,/g, '{');
  content = content.replace(/,\s*}/g, '}');
  content = content.replace(/,\s*,/g, ',');
  
  // Fix empty imports: import {} from ...
  content = content.replace(/import\s*{\s*}\s*from\s*['"][^'"]+['"];?\n?/g, '');
  
  // Also found: src/app/api/i18n/route.ts seems broken. Let's look at it manually later.
  
  if (content !== originalContent) {
    fs.writeFileSync(filepath, content, 'utf8');
    console.log(`Cleaned ${filepath}`);
  }
}

walk(srcDir, processFile);
