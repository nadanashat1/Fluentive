const fs = require('fs');
const path = require('path');

const srcDir = path.join(process.cwd(), 'src', 'app', 'api');

function walk(dir, callback) {
  if (!fs.existsSync(dir)) return;
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

  // Replace requireAuth() with requireAuth(request)
  content = content.replace(/requireAuth\(\)/g, 'requireAuth(request)');
  
  // If request is not defined but req is, change req to request
  if (content.includes('requireAuth(request)') && !content.includes('request: NextRequest') && !content.includes('request: Request')) {
    content = content.replace(/req: NextRequest/g, 'request: NextRequest');
    content = content.replace(/req: Request/g, 'request: Request');
  }

  // Also catch 'const user = await requireAuth(request)' -> 'const { user, error } = await requireAuth(request)'
  content = content.replace(/const\s+user\s*=\s*await\s+requireAuth\((.*?)\)/g, 'const { user, error } = await requireAuth($1)');

  if (content !== originalContent) {
    fs.writeFileSync(filepath, content, 'utf8');
    console.log(`Fixed requireAuth in ${filepath}`);
  }
}

walk(srcDir, processFile);
console.log('requireAuth fix complete.');
