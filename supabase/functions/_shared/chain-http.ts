/** Narrow HTTP boundary for the Fuji demo. Never return raw RPC/SQL errors. */
const statuses = {
  invalid_request: 400, request_too_large: 413, request_timeout: 408,
  unauthenticated: 401, daily_limit: 429, ip_limit: 429,
  no_item: 404, no_intent: 404, bound_item: 409, level_or_inventory: 409,
  seal_unpaid: 409, no_judge_pass: 409, invalid_action: 400,
  cosmetic_unpaid:409, cosmetic_locked:409,
  sponsor_low: 503, gas_unavailable: 503,
  tester_budget_unavailable:503, tester_budget_exhausted:503, tester_pool_low:503,
  campaign_disabled:503,campaign_rules_changed:409,campaign_stale:409,campaign_conflict:409,
  campaign_daily_starts:429,campaign_choice:409,campaign_equipped:409,campaign_source:409,
  campaign_level:409,campaign_in_run:409,
  routine_disabled:503,routine_unearned:409,routine_zero_award:409,routine_unfinalized:409,
  routine_period:409,routine_cap:409,routine_budget:503,routine_expired:409,routine_pool:503,
} as const;
export type ChainErrorCode = keyof typeof statuses;
export class ChainRequestError extends Error {
  constructor(readonly code: ChainErrorCode) { super(code); this.name = 'ChainRequestError'; }
}
const sqlCodes = new Set<string>([
  'unauthenticated', 'daily_limit', 'ip_limit', 'no_item', 'no_intent',
  'level_or_inventory', 'sponsor_low', 'gas_unavailable',
  'cosmetic_locked', 'invalid_request',
  'tester_budget_unavailable', 'tester_budget_exhausted', 'tester_pool_low',
  'campaign_disabled','campaign_rules_changed','campaign_stale','campaign_conflict','campaign_source',
  'routine_disabled','routine_unearned','routine_zero_award','routine_unfinalized','routine_period',
  'routine_cap','routine_budget','routine_expired','routine_pool',
]);
export function chainStoreError(error: unknown): Error {
  if (error instanceof ChainRequestError) return error;
  const value = error as {code?: unknown; message?: unknown} | null;
  // Only exact, deliberate RAISE EXCEPTION codes are safe to disclose. Details,
  // hints, constraint names and arbitrary messages never cross this boundary.
  if (value?.code === 'P0001' && typeof value.message === 'string' && sqlCodes.has(value.message)) {
    return new ChainRequestError(value.message as ChainErrorCode);
  }
  return new Error('chain_dependency_unavailable');
}
const routineCodes=new Set(['routine_disabled','routine_unearned','routine_zero_award','routine_unfinalized',
  'routine_period','routine_cap','routine_budget','routine_expired','routine_pool']);
export function routineError(error:unknown):unknown {
  return error instanceof Error&&routineCodes.has(error.message)?new ChainRequestError(error.message as ChainErrorCode):error;
}
export function chainFailure(error: unknown, fallback: string) {
  return error instanceof ChainRequestError
    ? {status: statuses[error.code], body: {error: error.code}}
    : {status: 503, body: {error: fallback}};
}

export const CHAIN_BODY_BYTES = 1024;
export const CHAIN_BODY_TIMEOUT_MS = 10_000;
export type ChainEndpoint = 'guest-drip' | 'chain-judge' | 'chain-items' | 'chain-cosmetics' | 'chain-campaign' | 'chain-campaign-reward' | 'chain-economy-v3';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Validate action/IDs before any RPC, inventory query or signature is created. */
function validateBody(endpoint: ChainEndpoint, body: unknown): Record<string, unknown> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new ChainRequestError('invalid_request');
  const value = body as Record<string, unknown>;
  let fields: string[];
  if(endpoint==='chain-economy-v3'){if(typeof value.id!=='string'||!uuid.test(value.id)||!value.command||typeof value.command!=='object'||Array.isArray(value.command))throw new ChainRequestError('invalid_request');fields=['id','command'];}
  else if (endpoint === 'guest-drip') fields = [];
  else if(endpoint==='chain-campaign-reward'&&(value.action==='quote'||value.action==='claim')){
    if(!['weekly-boss','season-rank'].includes(String(value.kind)))throw new ChainRequestError('invalid_request');
    fields=['action','kind'];
  }
  else if(endpoint==='chain-campaign'&&value.action==='state')fields=['action'];
  else if(endpoint==='chain-campaign'&&value.action==='command'){
    if(typeof value.id!=='string'||!uuid.test(value.id)||!Number.isSafeInteger(value.revision)||Number(value.revision)<0||!value.command||typeof value.command!=='object'||Array.isArray(value.command))throw new ChainRequestError('invalid_request');
    fields=['action','id','revision','command'];
  }
  else if (endpoint === 'chain-judge' && (value.action === 'pass' || value.action === 'boss')) fields = ['action'];
  else if (endpoint === 'chain-items' && (value.action === 'inventory' || value.action === 'reward')) fields = ['action'];
  else if (endpoint === 'chain-cosmetics' && value.action === 'state') fields = ['action'];
  else if (endpoint === 'chain-cosmetics' && (value.action === 'reserve' || value.action === 'equip')) {
    if(typeof value.sku!=='string'||!['fern','tide','ember',...(value.action==='equip'?['none']:[])].includes(value.sku))
      throw new ChainRequestError('invalid_request');
    fields=['action','sku'];
  }
  else if(endpoint==='chain-cosmetics'&&value.action==='finalize') {
    if(typeof value.intent!=='string'||!uuid.test(value.intent))throw new ChainRequestError('invalid_request');
    fields=['action','intent'];
  }
  else if (endpoint === 'chain-items' && (value.action === 'reserve' || value.action === 'finalize')) {
    const id = value.action === 'reserve' ? 'inventory' : 'intent';
    if (typeof value[id] !== 'string' || !uuid.test(value[id])) throw new ChainRequestError('invalid_request');
    fields = ['action', id];
  } else throw new ChainRequestError('invalid_action');
  if (Object.keys(value).some(key => !fields.includes(key))) throw new ChainRequestError('invalid_request');
  return value;
}

/** Counts actual UTF-8 bytes and bounds total upload time, including chunked bodies. */
export async function readChainBody(req: Request, endpoint: ChainEndpoint): Promise<Record<string, unknown>> {
  const declared = req.headers.get('content-length');
  if (declared !== null && /^\d+$/.test(declared) && Number(declared) > CHAIN_BODY_BYTES) {
    void req.body?.cancel().catch(() => {});
    throw new ChainRequestError('request_too_large');
  }
  if (req.signal.aborted || !req.body) {
    void req.body?.cancel().catch(() => {});
    throw new ChainRequestError('invalid_request');
  }
  const reader = req.body.getReader(), bytes = new Uint8Array(CHAIN_BODY_BYTES);
  let size = 0, stopped: ChainRequestError | undefined;
  let rejectStop: (error: ChainRequestError) => void = () => {};
  const stop = new Promise<never>((_resolve, reject) => {rejectStop = reject;});
  const abort = (code: ChainErrorCode) => {
    if (stopped) return;
    stopped = new ChainRequestError(code);
    void reader.cancel().catch(() => {});
    rejectStop(stopped);
  };
  const cancelled = () => abort('invalid_request');
  const timer = setTimeout(() => abort('request_timeout'), CHAIN_BODY_TIMEOUT_MS);
  req.signal.addEventListener('abort', cancelled, {once: true});
  try {
    if (req.signal.aborted) cancelled();
    for (;;) {
      const {done, value} = await Promise.race([reader.read(), stop]);
      if (stopped) throw stopped;
      if (done) break;
      if (value.byteLength > bytes.length - size) throw new ChainRequestError('request_too_large');
      bytes.set(value, size); size += value.byteLength;
    }
    let body: unknown;
    try {body = JSON.parse(new TextDecoder('utf-8', {fatal: true}).decode(bytes.subarray(0, size)));}
    catch {throw new ChainRequestError('invalid_request');}
    return validateBody(endpoint, body);
  } catch (error) {
    if (!stopped) void reader.cancel().catch(() => {});
    throw error instanceof ChainRequestError ? error : new ChainRequestError('invalid_request');
  } finally {
    clearTimeout(timer); req.signal.removeEventListener('abort', cancelled); reader.releaseLock();
  }
}
