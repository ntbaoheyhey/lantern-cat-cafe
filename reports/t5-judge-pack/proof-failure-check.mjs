import http from 'node:http';
import { spawn } from 'node:child_process';
const root = process.argv[2];
let mode = 'empty';
const server = http.createServer(async (req, res) => {
  let body = ''; for await (const chunk of req) body += chunk;
  const call = JSON.parse(body);
  const results = {
    eth_chainId: mode === 'wrong-chain' ? '0x7a69' : '0xa869',
    eth_blockNumber: '0x1',
    eth_getBlockByNumber: { number: '0x1', hash: `0x${'1'.repeat(64)}`, timestamp: '0x1' },
    eth_getCode: mode === 'read-error' ? '0x6000' : '0x',
  };
  if (!(call.method in results) && call.method !== 'eth_call') throw new Error(`Unexpected RPC ${call.method}`);
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify(call.method === 'eth_call'
    ? { jsonrpc: '2.0', id: call.id, error: { code: -32000, message: 'fixture read failure' } }
    : { jsonrpc: '2.0', id: call.id, result: results[call.method] }));
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
try {
  for (const scenario of ['empty', 'wrong-chain', 'read-error']) {
    mode = scenario;
    const child = spawn(process.execPath, ['scripts/onchain-proof.mjs'], {
      cwd: root, env: { ...process.env, VITE_FUJI_RPC_URL: `http://127.0.0.1:${server.address().port}` },
    });
    let output = ''; child.stdout.on('data', (d) => output += d); child.stderr.on('data', (d) => output += d);
    const code = await new Promise((resolve) => child.on('exit', resolve));
    const expected = scenario === 'empty' ? (output.match(/"codePresent":false/g) || []).length === 2
      : scenario === 'wrong-chain' ? output.includes('Wrong RPC chain') : output.includes('NOT VERIFIED: owner:') && output.includes('NOT VERIFIED: activeListingCount:');
    if (code !== 1 || !expected) throw new Error(`FAIL ${scenario}: ${code}\n${output}`);
    console.log(`PASS ${scenario}: exit ${code}; ${scenario === 'empty' ? 'both missing contracts reported' : 'failure explicitly reported'}`);
  }
} finally { server.close(); }
