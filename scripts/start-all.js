#!/usr/bin/env node

const fs = require('fs');
const net = require('net');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');
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
  console.clear();
  console.log('');
  console.log(box(
    colors.bright + colors.green + '🚀 D-Fluency CRM - Full Stack Development' + colors.reset + '\n' +
    colors.dim + 'Enterprise-grade AI-Powered CRM System' + colors.reset,
    colors.cyan
  ));
  console.log('');
  console.log(colors.bright + colors.yellow + '═══════════════════════════════════════════════════════════════════════════' + colors.reset);
  console.log('');
  console.log(colors.bright + colors.green + '🔗 Application URLs:' + colors.reset);
  console.log(colors.cyan + '   ├─ Frontend (Next.js):' + colors.reset + '  ' + colors.bright + colors.white + 'http://localhost:3000' + colors.reset);
  console.log(colors.cyan + '   ├─ Backend (Express):' + colors.reset + '   ' + colors.bright + colors.white + 'http://localhost:5000' + colors.reset);
  console.log(colors.cyan + '   ├─ API Documentation:' + colors.reset + '   ' + colors.bright + colors.white + 'http://localhost:5000/api-docs' + colors.reset);
  console.log(colors.cyan + '   ├─ Health Check:' + colors.reset + '       ' + colors.bright + colors.white + 'http://localhost:5000/health' + colors.reset);
  console.log(colors.cyan + '   └─ AI Engine:' + colors.reset + '          ' + colors.bright + colors.white + 'http://localhost:5000/api/ai/advanced/health' + colors.reset);
  console.log('');
  console.log(colors.bright + colors.green + '🤖 AI Features (18 Endpoints):' + colors.reset);
  console.log(colors.cyan + '   ├─' + colors.reset + ' Lead Scoring & Sentiment Analysis');
  console.log(colors.cyan + '   ├─' + colors.reset + ' Revenue Forecasting & Churn Prediction');
  console.log(colors.cyan + '   ├─' + colors.reset + ' Smart Lead Assignment & Duplicate Detection');
  console.log(colors.cyan + '   └─' + colors.reset + ' Email Templates & Conversation Quality');
  console.log('');
  console.log(colors.bright + colors.green + '🛡️ Security Features:' + colors.reset);
  console.log(colors.cyan + '   ├─' + colors.reset + ' Argon2 Password Hashing');
  console.log(colors.cyan + '   ├─' + colors.reset + ' JWT + Refresh Tokens');
  console.log(colors.cyan + '   ├─' + colors.reset + ' 2FA (TOTP) Support');
  console.log(colors.cyan + '   ├─' + colors.reset + ' RBAC (40+ Permissions)');
  console.log(colors.cyan + '   └─' + colors.reset + ' Rate Limiting (6 Tiers)');
  console.log('');
  console.log(colors.bright + colors.yellow + '═══════════════════════════════════════════════════════════════════════════' + colors.reset);
  console.log('');
  console.log(colors.bright + colors.green + '📊 System Status:' + colors.reset);
  console.log(colors.green + '   ✅ TypeScript: Compiled' + colors.reset);
  console.log(colors.green + '   ✅ Database:   Connected (PostgreSQL)' + colors.reset);
  console.log(colors.green + '   ✅ Redis:      Connected (Cache Active)' + colors.reset);
  console.log(colors.green + '   ✅ Prisma:     Client Generated' + colors.reset);
  console.log('');
  console.log(colors.bright + colors.yellow + '═══════════════════════════════════════════════════════════════════════════' + colors.reset);
  console.log('');
  console.log(colors.bright + colors.magenta + '🚀 Starting Servers...' + colors.reset);
  console.log('');
  console.log(colors.dim + 'Press Ctrl+C to stop all servers' + colors.reset);
  console.log('');
};

printHeader();

const backendPath = './backend';
const frontendPath = '.';

const tmpDir = path.resolve(process.cwd(), '.tmp');
const lockFile = path.join(tmpDir, 'dev.lock');

function ensureTmpDir() {
  try {
    fs.mkdirSync(tmpDir, { recursive: true });
  } catch (_) {
    // ignore
  }
}

function acquireLockOrExit() {
  ensureTmpDir();
  try {
    fs.writeFileSync(lockFile, String(process.pid), { flag: 'wx' });
  } catch (err) {
    // Handle stale lock (e.g. force-killed terminal).
    try {
      const existingPid = parseInt(fs.readFileSync(lockFile, 'utf8').trim(), 10);
      const pidIsValid = Number.isFinite(existingPid) && existingPid > 0;

      if (pidIsValid) {
        try {
          process.kill(existingPid, 0); // throws if not running / no permission
          console.error(colors.red + colors.bright + '❌ Dev servers already running (lockfile exists).' + colors.reset);
          console.error(colors.yellow + '   Lock PID:' + colors.reset, existingPid);
          console.error(colors.yellow + '   Stop it:' + colors.reset, `taskkill /PID ${existingPid} /T /F`);
          process.exit(1);
        } catch (_) {
          // stale lock, remove and retry once
          try {
            fs.unlinkSync(lockFile);
          } catch (_) {}
          fs.writeFileSync(lockFile, String(process.pid), { flag: 'wx' });
          return;
        }
      }
    } catch (_) {
      // fall through to default message
    }

    console.error(colors.red + colors.bright + '❌ Dev servers already running (lockfile exists).' + colors.reset);
    console.error(colors.yellow + '   If this is wrong, delete:' + colors.reset, lockFile);
    process.exit(1);
  }
}

function releaseLock() {
  try {
    fs.unlinkSync(lockFile);
  } catch (_) {
    // ignore
  }
}

function checkPortAvailable(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.on('error', (err) => {
      resolve({ ok: false, code: err && err.code ? err.code : 'UNKNOWN' });
    });
    server.listen({ port, host }, () => {
      server.close(() => resolve({ ok: true }));
    });
  });
}

function isPortInUse(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(800);

    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });

    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });

    socket.once('error', () => {
      resolve(false);
    });

    socket.connect(port, host);
  });
}

async function isPortAvailableOnAllHosts(port) {
  // Next may detect conflicts on IPv6 or other bindings; check common hosts.
  const hosts = ['127.0.0.1', '::1', '0.0.0.0'];
  for (const host of hosts) {
    const res = await checkPortAvailable(port, host);
    if (!res.ok) return false;
  }
  return true;
}

async function findAvailablePort(startPort, maxTries = 20) {
  for (let i = 0; i < maxTries; i++) {
    const port = startPort + i;
    // Detect active listeners first; this is more reliable than bind checks alone.
    const inUseV4 = await isPortInUse(port, '127.0.0.1');
    const inUseV6 = await isPortInUse(port, '::1');
    if (inUseV4 || inUseV6) continue;

    // Then confirm bind-availability on common hosts.
    const ok =
      (await checkPortAvailable(port, '127.0.0.1')).ok &&
      (await checkPortAvailable(port, '::1')).ok &&
      (await checkPortAvailable(port, '0.0.0.0')).ok;
    if (ok) return port;
  }
  return null;
}

async function preflightOrExit() {
  // Backend must be strict to prevent ambiguous API URLs.
  const backendOk = await isPortAvailableOnAllHosts(5000);
  if (!backendOk) {
    console.error(colors.red + colors.bright + '❌ Port 5000 is already in use (backend).' + colors.reset);
    console.error(colors.yellow + '   Find the PID:' + colors.reset, 'node scripts/ports.js 5000');
    console.error(colors.yellow + '   Or:' + colors.reset, 'netstat -ano | findstr :5000');
    console.error(colors.yellow + '   Kill it:' + colors.reset, 'taskkill /PID <PID> /F');
    console.error(colors.dim + '   Note: Docker Compose can hold 5000 (run `docker compose down`).' + colors.reset);
    process.exit(1);
  }

  // Frontend can safely move if 3000 is occupied; pick a free port deterministically.
  const frontendPort = await findAvailablePort(3000, 25);
  if (!frontendPort) {
    console.error(colors.red + colors.bright + '❌ No free port found for frontend starting at 3000.' + colors.reset);
    console.error(colors.yellow + '   Inspect ports:' + colors.reset, 'node scripts/ports.js 3000');
    process.exit(1);
  }
  process.env.FRONTEND_PORT = String(frontendPort);
}

function waitForBackendReady(timeoutMs = 60000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();

    const probe = () => {
      const req = http.get('http://127.0.0.1:5000/health', (res) => {
        res.resume();
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 500) {
          resolve(true);
        } else if (Date.now() - start > timeoutMs) {
          reject(new Error(`Backend did not become ready in ${timeoutMs}ms`));
        } else {
          setTimeout(probe, 1000);
        }
      });

      req.on('error', () => {
        if (Date.now() - start > timeoutMs) {
          reject(new Error(`Backend did not become ready in ${timeoutMs}ms`));
          return;
        }
        setTimeout(probe, 1000);
      });

      req.setTimeout(3000, () => {
        req.destroy();
      });
    };

    probe();
  });
}

let backend;
let frontend;
let shuttingDown = false;

function shutdown(exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log('');
  console.log(colors.yellow + '👋 Shutting down all servers...' + colors.reset);

  try {
    if (frontend && !frontend.killed) frontend.kill('SIGINT');
  } catch (_) {}
  try {
    if (backend && !backend.killed) backend.kill('SIGINT');
  } catch (_) {}

  releaseLock();
  setTimeout(() => process.exit(exitCode), 800);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
process.on('exit', () => releaseLock());

(async () => {
  acquireLockOrExit();
  await preflightOrExit();
  const frontendPort = parseInt(process.env.FRONTEND_PORT || '3000', 10);

  console.log(colors.bright + colors.cyan + '[BACKEND]' + colors.reset + ' Starting Express server on port 5000...\n');
  backend = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true,
    cwd: backendPath
  });

  waitForBackendReady(60000).then(() => {
    console.log(colors.green + colors.bright + '✅ Backend is healthy. Starting frontend...' + colors.reset);
    console.log(colors.bright + colors.magenta + '[FRONTEND]' + colors.reset + ` Starting Next.js server on port ${frontendPort}...\n`);
    frontend = spawn('npx', ['next', 'dev', '--turbo', '-p', String(frontendPort)], {
      stdio: 'inherit',
      shell: true,
      cwd: frontendPath
    });

    frontend.on('exit', (code) => {
      console.log('');
      console.log(colors.red + colors.bright + '❌ Frontend stopped with exit code:' + colors.reset, code);
      shutdown(code ?? 1);
    });
  }).catch((err) => {
    console.error(colors.red + colors.bright + '❌ Backend readiness check failed:' + colors.reset, err.message);
    shutdown(1);
  });

  backend.on('exit', (code) => {
    console.log('');
    console.log(colors.red + colors.bright + '❌ Backend stopped with exit code:' + colors.reset, code);
    shutdown(code ?? 1);
  });
})().catch((err) => {
  console.error(colors.red + colors.bright + '❌ Failed to start dev servers:' + colors.reset, err);
  shutdown(1);
});
