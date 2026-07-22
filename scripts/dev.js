#!/usr/bin/env node

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

const box = (text, borderColor = colors.cyan) => {
  const lines = text.split('\n');
  const maxLength = Math.max(...lines.map(line => line.length));
  const border = borderColor + '│' + colors.reset;
  const top = borderColor + '┌' + '─'.repeat(maxLength + 2) + '┐' + colors.reset;
  const bottom = borderColor + '└' + '─'.repeat(maxLength + 2) + '┘' + colors.reset;
  
  let result = top + '\n';
  lines.forEach(line => {
    result += border + ' ' + line.padEnd(maxLength) + ' ' + border + '\n';
  });
  result += bottom;
  return result;
};


const printHeader = () => {
  console.log('');
  console.log(box(
    colors.bright + colors.green + '🎨 D-Fluency CRM - Frontend Application' + colors.reset + '\n' +
    colors.dim + 'Modern React/Next.js Interface with AI-Powered Features' + colors.reset,
    colors.magenta
  ));
  console.log('');
  console.log(colors.bright + colors.yellow + '═══════════════════════════════════════════════════════════════════════════' + colors.reset);
  console.log('');
  console.log(colors.bright + colors.green + '🔗 Application Links:' + colors.reset);
  console.log(colors.magenta + '   ├─ Local:' + colors.reset + '      ' + colors.bright + colors.white + 'http://localhost:3000' + colors.reset);
  console.log(colors.magenta + '   ├─ Network:' + colors.reset + '   ' + colors.bright + colors.white + 'http://192.168.100.46:3000' + colors.reset);
  console.log(colors.magenta + '   └─ Backend:' + colors.reset + '   ' + colors.bright + colors.white + 'http://localhost:5000' + colors.reset);
  console.log('');
  console.log(colors.bright + colors.green + '✨ Frontend Features:' + colors.reset);
  console.log(colors.magenta + '   ├─' + colors.reset + ' Next.js 15.1.4 with App Router');
  console.log(colors.magenta + '   ├─' + colors.reset + ' TypeScript + TailwindCSS');
  console.log(colors.magenta + '   ├─' + colors.reset + ' Lucide Icons + shadcn/ui');
  console.log(colors.magenta + '   ├─' + colors.reset + ' Real-time AI Dashboard');
  console.log(colors.magenta + '   └─' + colors.reset + ' Responsive Design');
  console.log('');
  console.log(colors.bright + colors.green + '📊 Pages Available:' + colors.reset);
  console.log(colors.magenta + '   ├─' + colors.reset + ' /login - Authentication');
  console.log(colors.magenta + '   ├─' + colors.reset + ' /register - User Registration');
  console.log(colors.magenta + '   ├─' + colors.reset + ' /dashboard - AI-Powered Dashboard');
  console.log(colors.magenta + '   ├─' + colors.reset + ' /leads - Lead Management');
  console.log(colors.magenta + '   ├─' + colors.reset + ' /users - User Management');
  console.log(colors.magenta + '   └─' + colors.reset + ' /settings - Application Settings');
  console.log('');
  console.log(colors.bright + colors.yellow + '═══════════════════════════════════════════════════════════════════════════' + colors.reset);
  console.log('');
  console.log(colors.bright + colors.green + '🚀 Starting Next.js Development Server...' + colors.reset);
  console.log('');
  console.log(colors.dim + 'Press Ctrl+C to stop the server' + colors.reset);
  console.log('');
};

printHeader();

const { spawn } = require('child_process');

const server = spawn('npm', ['run', 'dev:raw'], {
  stdio: 'inherit',
  shell: true,
  cwd: process.cwd()
});

server.on('exit', (code) => {
  console.log('');
  console.log(colors.red + colors.bright + '❌ Frontend stopped with exit code:' + colors.reset, code);
  process.exit(code);
});

process.on('SIGINT', () => {
  console.log('');
  console.log(colors.yellow + '👋 Shutting down frontend...' + colors.reset);
  server.kill('SIGINT');
});
