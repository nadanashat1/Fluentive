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

  // Fix RoleType used as a value
  content = content.replace(/RoleType\.([A-Z_]+)/g, 'Roles.$1');

  if (content !== originalContent) {
    fs.writeFileSync(filepath, content, 'utf8');
    console.log(`Fixed ${filepath}`);
  }
}

walk(srcDir, processFile);
