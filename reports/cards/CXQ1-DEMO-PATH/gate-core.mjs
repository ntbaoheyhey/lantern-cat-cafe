import assert from 'node:assert/strict';
export const STAGES = ['landing','guest','class','idle-loop','boss','forge','bag','on-chain-proof','market'];
export const NFT = '0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D';
export const MARKET = '0x10fcC46e439d3E31Fb1720B337C45CadB9b2ff93';
export const READ_RPC = new Set(['eth_chainId','eth_blockNumber','eth_call','eth_getCode','eth_getBalance','eth_getLogs','eth_getBlockByNumber','eth_getTransactionReceipt','eth_getTransactionByHash','net_version']);
export function allowedRequest(method, body) {
  if (['GET','HEAD','OPTIONS'].includes(method)) return true;
  if (method !== 'POST') return false;
  try { const v = JSON.parse(body); const calls = Array.isArray(v) ? v : [v]; return calls.length > 0 && calls.every(x => x.jsonrpc === '2.0' && READ_RPC.has(x.method)); } catch { return false; }
}
export function assertProof(text, links) {
  assert.match(text, /Avalanche Fuji/i, 'Proof must identify Avalanche Fuji');
  assert.match(text, /testnet/i, 'Proof must distinguish testnet');
  assert.match(text, /(?:guest|demo|preview|simulat)/i, 'Proof must identify guest preview');
  assert.match(text, /(?:not (?:a |an )?(?:on.chain |real )?transaction|no (?:on.chain )?transaction|not minted)/i, 'Preview must explicitly distinguish a chain transaction');
  for (const address of [NFT, MARKET]) {
    assert.ok(text.toLowerCase().includes(address.toLowerCase()), `Full visible contract address missing: ${address}`);
    assert.ok(links.some(link => { try { const u = new URL(link); return u.protocol === 'https:' && (u.hostname === 'testnet.snowtrace.io' || u.hostname === 'testnet.routescan.io') && u.pathname.toLowerCase().includes(address.toLowerCase()); } catch { return false; } }), `Fuji explorer contract link missing: ${address}`);
  }
}
export async function runStages(actions, { now = Date.now, budgetMs = 180000, health = () => {}, afterStep = async () => {} } = {}) {
  const started = now(); const steps = []; let blockedBy = null;
  for (const name of STAGES) {
    if (blockedBy) { steps.push({name,status:'BLOCKED',blockedBy}); continue; }
    const t = now(); let captureAttempted = false;
    try {
      assert.ok(t - started < budgetMs, 'Three-minute judge budget exceeded');
      await actions[name](); health();
      assert.ok(now() - started <= budgetMs, 'Three-minute judge budget exceeded');
      const step = {name,status:'PASS',elapsedMs:now()-t};
      captureAttempted = true; await afterStep(step); health();
      assert.ok(now() - started <= budgetMs, 'Three-minute judge budget exceeded during evidence capture');
      steps.push(step);
    } catch (error) {
      const step = {name,status:'FAIL',elapsedMs:now()-t,error:String(error.message)};
      try { if (!captureAttempted) await afterStep(step); } catch (captureError) { step.captureError = String(captureError.message); }
      steps.push(step); blockedBy = name;
    }
  }
  return {status:blockedBy?'FAIL':'PASS',durationMs:now()-started,steps};
}
