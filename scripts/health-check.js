#!/usr/bin/env node

const http = require("http");
const fs = require("fs");
const path = require("path");

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
}

function requestJson(url, timeoutMs = 2000) {
  return new Promise((resolve) => {
    const req = http.get(url, { timeout: timeoutMs }, (res) => {
      let body = "";
      res.on("data", (c) => (body += c));
      res.on("end", () => {
        try {
          const json = JSON.parse(body);
          resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, json });
        } catch {
          resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, json: null });
        }
      });
    });
    req.on("timeout", () => {
      req.destroy();
      resolve({ ok: false, status: 0, json: null, timeout: true });
    });
    req.on("error", () => resolve({ ok: false, status: 0, json: null }));
  });
}

function checkLockfile() {
  const lock = path.resolve(process.cwd(), ".tmp", "dev.lock");
  if (!fs.existsSync(lock)) return { present: false, lock };
  const pid = parseInt(String(fs.readFileSync(lock, "utf8")).trim(), 10);
  return { present: true, lock, pid: Number.isFinite(pid) ? pid : null };
}

(async () => {
  const base = getBaseUrl();
  const healthUrl = `${base}/health`;
  const health = await requestJson(healthUrl);
  const lock = checkLockfile();

  const lines = [];
  lines.push(`API_BASE=${base}`);
  lines.push(`BACKEND_HEALTH=${health.ok ? "OK" : "FAIL"}${health.status ? ` (HTTP ${health.status})` : ""}`);
  if (health.timeout) lines.push("BACKEND_HEALTH_TIMEOUT=1");

  if (lock.present) lines.push(`DEV_LOCK=present (${lock.lock}) PID=${lock.pid ?? "unknown"}`);
  else lines.push("DEV_LOCK=absent");

  console.log(lines.join("\n"));
  process.exit(health.ok ? 0 : 1);
})();

