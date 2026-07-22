#!/usr/bin/env node

const { execSync } = require('child_process');

function run(cmd) {
  try {
    return execSync(cmd, { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' }).trim();
  } catch (err) {
    const out = (err && err.stdout ? String(err.stdout) : '').trim();
    const e = (err && err.stderr ? String(err.stderr) : '').trim();
    return [out, e].filter(Boolean).join('\n').trim();
  }
}

function isWindows() {
  return process.platform === 'win32';
}

const ports = process.argv.slice(2).filter(Boolean);
const targetPorts = ports.length ? ports : ['5000', '3000'];

for (const port of targetPorts) {
  console.log(`\n=== Port ${port} ===`);
  if (isWindows()) {
    const output = run(`netstat -ano | findstr :${port}`);
    console.log(output || '(no listeners found)');
    if (output) {
      console.log('\nKill example: taskkill /PID <PID> /F');
    }
  } else {
    const output = run(`lsof -nP -iTCP:${port} -sTCP:LISTEN`);
    console.log(output || '(no listeners found)');
  }
}

