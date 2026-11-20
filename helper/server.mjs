// Local helper for the Suggestion Bot extension.
// Runs Claude Code in print mode with your existing login and returns a reply draft.
// Start with: pnpm helper

import http from 'node:http';
import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildSystemPrompt, buildUserPrompt } from './prompt.mjs';

const HOST = '127.0.0.1';
const PORT = Number(process.env.SUGGESTION_BOT_PORT ?? 43117);
const MODEL = process.env.SUGGESTION_BOT_MODEL ?? 'haiku';
const CLAUDE_BIN = process.env.CLAUDE_BIN ?? 'claude';
const TIMEOUT_MS = 90_000;
const MAX_BODY_BYTES = 256 * 1024;

// Claude runs in an empty directory so it has no project files or CLAUDE.md to pick up.
const workDir = mkdtempSync(join(tmpdir(), 'suggestion-bot-'));

function originAllowed(req) {
  const origin = req.headers.origin;
  // Browsers always send Origin on cross-origin POSTs, so a web page cannot hide it.
  // Requests without one come from local tools such as curl.
  return !origin || origin.startsWith('chrome-extension://');
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error('Request too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function runClaude(systemPrompt, userPrompt, signal) {
  return new Promise((resolve, reject) => {
    const args = [
      '-p',
      '--model', MODEL,
      '--system-prompt', systemPrompt,
      '--tools', '',
      '--strict-mcp-config',
      '--disable-slash-commands',
      '--no-session-persistence',
      '--output-format', 'text',
    ];
    const child = spawn(CLAUDE_BIN, args, { cwd: workDir, stdio: ['pipe', 'pipe', 'pipe'], signal });
    let out = '';
    let err = '';
    const timer = setTimeout(() => child.kill('SIGTERM'), TIMEOUT_MS);
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (err += d));
    child.on('error', (e) => {
      clearTimeout(timer);
      reject(e.code === 'ENOENT' ? new Error('Claude Code is not installed or not on PATH') : e);
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0 && out.trim()) resolve(out.trim());
      else reject(new Error((err || out).trim().slice(0, 500) || `Claude exited with code ${code}`));
    });
    child.stdin.end(userPrompt);
  });
}

const server = http.createServer(async (req, res) => {
  const send = (status, body) => {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(body));
  };

  if (!originAllowed(req)) return send(403, { error: 'Origin not allowed' });

  if (req.method === 'GET' && req.url === '/health') {
    return send(200, { ok: true, model: MODEL });
  }

  if (req.method === 'POST' && req.url === '/suggest') {
    if (!String(req.headers['content-type'] ?? '').startsWith('application/json')) {
      return send(415, { error: 'Content-Type must be application/json' });
    }
    let body;
    try {
      body = await readJson(req);
    } catch (e) {
      return send(400, { error: e.message });
    }
    if (!body?.capture?.text || typeof body.capture.text !== 'string') {
      return send(400, { error: 'capture.text is required' });
    }

    // Send headers now: the extension's background worker is stopped if a
    // response takes too long to start.
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.flushHeaders();

    const abort = new AbortController();
    res.on('close', () => {
      if (!res.writableEnded) abort.abort();
    });

    const started = Date.now();
    try {
      const reply = await runClaude(buildSystemPrompt(body), buildUserPrompt(body), abort.signal);
      console.log(`reply in ${((Date.now() - started) / 1000).toFixed(1)}s`);
      res.end(JSON.stringify({ reply }));
    } catch (e) {
      if (abort.signal.aborted) return;
      console.error('claude failed:', e.message);
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  send(404, { error: 'Not found' });
});

server.on('error', (e) => {
  console.error(e.code === 'EADDRINUSE' ? `Port ${PORT} is already in use. Is the helper already running?` : e);
  process.exit(1);
});

server.listen(PORT, HOST, () => {
  console.log(`Suggestion Bot helper listening on http://${HOST}:${PORT} (model: ${MODEL})`);
});
