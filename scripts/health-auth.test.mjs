import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('./health-auth.sh', import.meta.url));
const run = url => new Promise(resolve => {
  const child = spawn('sh', [script, url]);
  let output = '';
  child.stdout.on('data', data => { output += data; });
  child.stderr.on('data', data => { output += data; });
  child.on('close', code => resolve({ code, output }));
});

for (const status of [200, 429, 500, 502, 503]) {
  test(`auth health HTTP ${status} exits correctly without leaking response data`, async () => {
    let request;
    const server = createServer((req, res) => {
      request = { method: req.method, path: req.url, contentType: req.headers['content-type'] };
      res.writeHead(status, { 'content-type': 'application/json' });
      res.end('{"nonce":"must-not-be-printed","token":"also-private"}');
    }).listen(0, '127.0.0.1');
    await once(server, 'listening');
    try {
      const result = await run(`http://127.0.0.1:${server.address().port}/`);
      assert.equal(result.code, status === 200 ? 0 : 1);
      assert.match(result.output, new RegExp(`auth-nonce HTTP ${status}`));
      assert.doesNotMatch(result.output, /must-not-be-printed|also-private|nonce.*token/);
      assert.deepEqual(request, { method: 'POST', path: '/functions/v1/auth-nonce', contentType: 'application/json' });
    } finally { await new Promise(resolve => server.close(resolve)); }
  });
}

test('auth health fails closed when the transport is unavailable', async () => {
  const server = createServer().listen(0, '127.0.0.1');
  await once(server, 'listening');
  const port = server.address().port;
  await new Promise(resolve => server.close(resolve));
  const result = await run(`http://127.0.0.1:${port}`);
  assert.equal(result.code, 1);
  assert.equal(result.output, 'FAIL auth-nonce transport unavailable\n');
});
