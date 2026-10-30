# Shared request budgets for v2 — proposal only

> **Status (2026-10-30):** per-player budgets are implemented: migration `supabase/migrations/20261104000000_v2_request_budgets.sql` (apply by hand), `supabase/functions/_shared/v2/budgets.ts`, wired into every v2 route through `handlerV2`. Per-IP budgets and the proxy envelope are still NOT implemented (no verified trusted IP header). **Order matters: apply the migration BEFORE redeploying the v2 Edge Functions**, because the limiter fails closed (503) when `v2_take_budgets` is missing. No client change yet: the web app should show `retryAfter` from HTTP 429.

Do not apply this sketch in S2. It requires an approved SQL migration, shared wrapper integration and a frontend API-root change. No paid add-on, Redis account or new npm dependency is required: keep counters in the existing Supabase Postgres database. This is an engineering design for the existing free project, not a guarantee that unbounded hostile traffic fits its quota. Supabase currently lists a free shared database with 500 MB storage; Edge Functions also have CPU/invocation limits. The counter RPC itself costs database work and cannot refund an invocation that already reached Supabase. [Free plan](https://supabase.com/pricing), [function limits](https://supabase.com/docs/guides/functions/limits). Supabase's [Redis example](https://supabase.com/docs/guides/functions/examples/rate-limiting) illustrates shared atomic counters; the sketch below uses Postgres instead.

## Identity, limits and behavior

After verifying JWT `sub`, charge both that player's route budget and aggregate player budget before any snapshot, simulation, signing or Fuji call. Also charge a trusted-IP route and aggregate budget, including rejected authentication attempts. OPTIONS is uncharged and small; other methods reject immediately. Preserve the new 8 KiB actual-byte body limit. Key IPs using HMAC-SHA256 with a daily UTC epoch and a dedicated server-side limiter secret; store no raw IP, JWT or wallet signature. Apply the IP aggregate budget *before* per-route buckets to bound wallet spraying. One shared key per IP/day aggregates routes, not one key per arbitrary supplied subject.

Start with the following rates per minute and immediate burst capacities (GCRA continuously refills; there is no fixed-window boundary doubling). These are HTTP budgets, not economy numbers, and should be tuned after measuring real traffic. IP limits intentionally allow several players behind one cafe/NAT.

| Route | Player rate / burst | IP rate / burst |
| --- | --- | --- |
| v2-state | 30 / 5 | 180 / 20 |
| v2-claim | 12 / 2 | 90 / 10 |
| v2-equip | 30 / 6 | 180 / 30 |
| v2-choose-class | 6 / 2 | 30 / 8 |
| v2-boss-fight | 10 / 2 | 60 / 8 |
| v2-craft | 10 / 2 | 60 / 8 |
| v2-salvage | 10 / 2 | 60 / 8 |
| v2-lock | 30 / 6 | 180 / 30 |
| v2-relic-forge | 4 / 1 | 20 / 4 |
| all v2 routes combined | 120 / 20 | 600 / 60 |
| auth-nonce (later auth card) | anonymous | 10 / 3 |
| auth-verify (later auth card) | 6 / 2 per recovered wallet | 10 / 3 |

Reject over budget with HTTP 429, JSON `{ "error": "rate_limited", "retryAfter": N }`, `Retry-After: N`, and `Access-Control-Expose-Headers: Retry-After`. The reserved v2 error code already exists. Client keeps the current state, tells the player when to retry, and waits with jitter; it must not replay craft/boss operations automatically until the durable idempotency proposal is implemented. Expose only a delay, never a subject key or token count.

If the counter store errors, **fail closed for every route**, including state: HTTP 503 `{ "error": "server_error" }`, `Retry-After: 5`. State also acquires a database lock and can sign/persist a voucher, so calling it during a counter outage is not a harmless bypass. Existing client state remains visible; a temporary outage must not become free unlimited expensive requests. Add aggregate error counts to logs, never request bodies. An optional isolate-local negative cache can soften repeated denials but cannot grant permits or replace the shared database.

## Trusted IP and direct-origin bypass

Do **not** trust a browser-supplied `x-forwarded-for`, `x-real-ip` or `cf-connecting-ip` on the current direct Supabase endpoint. A provider-verified, deployment-specific IP-header contract has NOT been established in S2. Use the existing Vercel deployment as a small same-origin proxy: Vercel [documents overwriting forwarded client IP headers](https://vercel.com/docs/headers/request-headers). Validate that contract on the deployed proxy before enabling quotas; an additional upstream proxy changes the trust boundary.

The proxy reads Vercel's overwritten `x-forwarded-for` as a single validated IP using Node `net.isIP`, bounds the request body, and emits an HMAC envelope over timestamp, UUID request id, canonical IP, method, allowlisted route, bearer-token SHA256 and body SHA256. Strip *all* incoming `x-budget-*` headers. Forward only the required auth/apikey/content-type headers and freshly generated envelope. The Edge Function verifies HMAC, 30-second freshness, method/route/body/token binding **before** trusting the IP, then uses that request id as a short-lived replay key in Postgres. Direct requests with missing/invalid envelopes are refused before database/simulation/RPC work. Secrets exist only on the two servers. A forged header can no longer create a fresh IP bucket.

This proxy integration is part of the later card, not an assertion about today's deployment. It consumes Vercel Hobby compute and still permits direct traffic to consume a minimal Supabase invocation before envelope rejection; free hosting is not unlimited DDoS protection. If the proxy trust contract cannot be verified, leave the feature disabled and say per-IP protection is NOT VERIFIED; do not silently claim that a hash of an attacker header is a budget. Per-player budgets can ship independently while the proxy is reviewed.

## Migration sketch (run only after approval)

This SQL is exercised only in an in-memory PGlite test by S2. No live database was accessed. The limiter table is private and only its service-role RPC is exposed. Buckets expire after one day; an indexed cleanup RPC below bounds deletes. A later card may schedule it with Supabase Cron, or call it from an owner-operated maintenance job; limiter correctness does not depend on exact cleanup timing. Row growth is still subject to project storage limits.

```sql
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table private.v2_request_budgets (
  bucket text primary key check (length(bucket) between 1 and 240),
  tat timestamptz not null,
  expires_at timestamptz not null
);
create index v2_request_budgets_expiry on private.v2_request_budgets (expires_at);
alter table private.v2_request_budgets enable row level security;
revoke all on private.v2_request_budgets from public, anon, authenticated;

-- Supply at most four SERVER-CONSTRUCTED {key, perMinute, burst} budgets per invocation.
-- Sort keys so overlapping requests acquire locks in one order.
-- A denied later budget can conservatively charge earlier budgets; this is intentional.
create function public.v2_take_budgets(p_budgets jsonb) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  b jsonb;
  k text;
  rate integer;
  burst integer;
  step interval;
  tolerance interval;
  now_at timestamptz := clock_timestamp();
  accepted_at timestamptz;
  current_tat timestamptz;
begin
  if jsonb_typeof(p_budgets) is distinct from 'array'
     or jsonb_array_length(p_budgets) not between 1 and 4 then
    raise exception 'invalid budgets';
  end if;
  for b in select value from jsonb_array_elements(p_budgets) order by value->>'key' loop
    k := b->>'key'; rate := (b->>'perMinute')::integer; burst := (b->>'burst')::integer;
    if k is null or length(k) not between 1 and 240 or rate is null or burst is null
       or rate not between 1 and 10000 or burst not between 1 and 1000 then
      raise exception 'invalid budget';
    end if;
    step := interval '60 seconds' / rate;
    tolerance := (burst - 1) * step;
    accepted_at := null;
    insert into private.v2_request_budgets as limits (bucket, tat, expires_at)
      values (k, now_at + step, now_at + interval '1 day')
    on conflict (bucket) do update
      set tat = greatest(limits.tat, now_at) + step,
          expires_at = now_at + interval '1 day'
      where limits.tat <= now_at + tolerance
    returning tat into accepted_at;
    if accepted_at is null then
      select tat into current_tat from private.v2_request_budgets where bucket = k;
      return jsonb_build_object('allowed', false, 'retryAfter',
        greatest(1, ceil(extract(epoch from current_tat - tolerance - now_at))::integer));
    end if;
  end loop;
  return jsonb_build_object('allowed', true);
end;
$$;
revoke all on function public.v2_take_budgets(jsonb) from public, anon, authenticated;
grant execute on function public.v2_take_budgets(jsonb) to service_role;

create function public.v2_cleanup_budgets() returns void
language sql volatile security definer set search_path = '' as $$
  delete from private.v2_request_budgets where bucket in (
    select bucket from private.v2_request_budgets where expires_at < now()
    order by expires_at limit 1000
  );
$$;
revoke all on function public.v2_cleanup_budgets() from public, anon, authenticated;
grant execute on function public.v2_cleanup_budgets() to service_role;
```

Edge integration sketch, after trusted envelope verification and JWT validation (the IP-only call happens before JWT validation). `ipKey` is the HMAC pseudonym described above; `player` is exclusively the verified JWT `sub`. Never accept limits or keys from the body.

```ts
const routeLimits = {
  'v2-state': [30, 5, 180, 20], 'v2-claim': [12, 2, 90, 10],
  'v2-equip': [30, 6, 180, 30], 'v2-choose-class': [6, 2, 30, 8],
  'v2-boss-fight': [10, 2, 60, 8], 'v2-craft': [10, 2, 60, 8],
  'v2-salvage': [10, 2, 60, 8], 'v2-lock': [30, 6, 180, 30],
  'v2-relic-forge': [4, 1, 20, 4],
} as const;
async function reserve(db: { rpc(name: string, args: object): PromiseLike<{ data: any; error: unknown }> },
  budgets: { key: string; perMinute: number; burst: number }[]) {
  try {
    const { data, error } = await db.rpc('v2_take_budgets', { p_budgets: budgets });
    if (error || !data || typeof data.allowed !== 'boolean') return { status: 503, error: 'server_error', retryAfter: 5 };
    if (!data.allowed) return { status: 429, error: 'rate_limited', retryAfter: data.retryAfter };
    return null;
  } catch { return { status: 503, error: 'server_error', retryAfter: 5 }; }
}
async function admitIp(db: Parameters<typeof reserve>[0], route: keyof typeof routeLimits, ipKey: string) {
  const [, , perMinute, burst] = routeLimits[route];
  return reserve(db, [
    { key: `ip:${ipKey}:all`, perMinute: 600, burst: 60 },
    { key: `ip:${ipKey}:${route}`, perMinute, burst },
  ]);
}
async function admitPlayer(db: Parameters<typeof reserve>[0], route: keyof typeof routeLimits, player: string) {
  const [perMinute, burst] = routeLimits[route];
  return reserve(db, [
    { key: `player:${player}:all`, perMinute: 120, burst: 20 },
    { key: `player:${player}:${route}`, perMinute, burst },
  ]);
}
// Map a refusal through the existing CORS JSON helper, add Retry-After and expose it.
// Catch RPC transport exceptions as the same 503 refusal; never continue game work on error.
```

The migration also needs a private `proxy_requests(request_id uuid primary key, expires_at timestamptz)` replay table, with client grants revoked, RLS default deny, and an envelope-admission RPC doing `INSERT ... ON CONFLICT DO NOTHING RETURNING request_id` after signature verification. Charge valid replay attempts against the same IP; do not allow duplicate envelope IDs to run mutations. Retain IDs for at least the envelope validity plus clock skew (two minutes), clean in batches. The proxy uses a fresh envelope per HTTP retry; action idempotency uses a different stable client request id, described in [state integrity](v2-state-integrity.md).

Apply in a later card: create/verify grants in a disposable DB, concurrency-test budgets and envelope replays, integrate wrappers/client proxy root, verify actual IP header spoofing fails on the deployed proxy, then enable limits with logs. Failure mode and honest residual risk must appear in the owner runbook. No live SQL, proxy or rate limiter was installed by S2.

## Proxy envelope implementation sketch

Place this shared WebCrypto code on the proxy and Edge side. It binds the *exact* buffered body bytes and bearer header; do not parse/re-encode JSON between sealing and verification. On the proxy, `boundedBytes` must use the same streaming-byte approach as S2's reader (8 KiB), and the route must come from the fixed route allowlist above. On Edge, verification precedes the IP budget; consume the envelope UUID atomically before gameplay. A missing or failed signature is an unauthenticated request, not permission to fall back to attacker headers.

```ts
const enc = new TextEncoder();
const hex = (b: ArrayBuffer) => Array.from(new Uint8Array(b), n => n.toString(16).padStart(2, '0')).join('');
const sha = async (bytes: Uint8Array) => hex(await crypto.subtle.digest('SHA-256', bytes));
const macKey = (secret: string) => crypto.subtle.importKey('raw', enc.encode(secret),
  { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
async function envelopeMessage(req: Request, route: string, body: Uint8Array, ip: string, at: string, id: string) {
  return enc.encode(JSON.stringify([at, id, ip, req.method, route,
    await sha(enc.encode(req.headers.get('authorization') ?? '')), await sha(body)]));
}
async function sealEnvelope(req: Request, route: string, body: Uint8Array, ip: string, secret: string): Promise<Headers> {
  const at = String(Math.floor(Date.now() / 1000));
  const id = crypto.randomUUID();
  const message = await envelopeMessage(req, route, body, ip, at, id);
  const signature = hex(await crypto.subtle.sign('HMAC', await macKey(secret), message));
  return new Headers({ 'x-budget-ip': ip, 'x-budget-at': at, 'x-budget-id': id, 'x-budget-mac': signature });
}
async function verifyEnvelope(req: Request, route: string, body: Uint8Array, secret: string) {
  const ip = req.headers.get('x-budget-ip') ?? '';
  const at = req.headers.get('x-budget-at') ?? '';
  const id = req.headers.get('x-budget-id') ?? '';
  const signature = req.headers.get('x-budget-mac') ?? '';
  if (ip.length < 2 || ip.length > 45 || !/^\d{10}$/.test(at) ||
      Math.abs(Date.now() / 1000 - Number(at)) > 30 ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id) ||
      !/^[0-9a-f]{64}$/.test(signature)) throw new Error('unauthenticated');
  const bytes = Uint8Array.from(signature.match(/../g)!, pair => parseInt(pair, 16));
  if (!await crypto.subtle.verify('HMAC', await macKey(secret), bytes,
      await envelopeMessage(req, route, body, ip, at, id))) throw new Error('unauthenticated');
  return { ip, requestId: id }; // Only this verified IP can enter HMAC pseudonymization.
}
// Proxy-only adapter (Node built-in; no dependency addition):
// import { isIP } from 'node:net';
// const ip = req.headers.get('x-forwarded-for') ?? '';
// if (isIP(ip) === 0) return new Response(null, { status: 400 });
// const signed = await sealEnvelope(req, route, boundedBytes, ip, proxySecret);
// const headers = new Headers(signed); // Never copy incoming x-budget-* values.
// headers.set('authorization', req.headers.get('authorization') ?? '');
// headers.set('content-type', 'application/json');
// headers.set('apikey', publicAnonKey);
// return fetch(`${fixedSupabaseRoot}/functions/v1/${route}`, {
//   method: 'POST', body: boundedBytes, headers, redirect: 'error',
// });
```

Envelope replay migration addition (same private schema, security posture and cleanup discipline as counters):

```sql
create table private.v2_proxy_requests (
  request_id uuid primary key,
  expires_at timestamptz not null default now() + interval '2 minutes'
);
create index v2_proxy_requests_expiry on private.v2_proxy_requests(expires_at);
alter table private.v2_proxy_requests enable row level security;
revoke all on private.v2_proxy_requests from public, anon, authenticated;
create function public.v2_admit_proxy_request(p_request_id uuid) returns boolean
language sql volatile security definer set search_path = '' as $$
  with inserted as (
    insert into private.v2_proxy_requests(request_id) values(p_request_id)
    on conflict do nothing returning request_id
  ) select exists(select 1 from inserted);
$$;
revoke all on function public.v2_admit_proxy_request(uuid) from public, anon, authenticated;
grant execute on function public.v2_admit_proxy_request(uuid) to service_role;
create function public.v2_cleanup_proxy_requests() returns void
language sql volatile security definer set search_path = '' as $$
  delete from private.v2_proxy_requests where request_id in (
    select request_id from private.v2_proxy_requests where expires_at < now()
    order by expires_at limit 1000
  );
$$;
revoke all on function public.v2_cleanup_proxy_requests() from public, anon, authenticated;
grant execute on function public.v2_cleanup_proxy_requests() to service_role;
```

Tests before enabling: change body/token/route/IP/timestamp and verify MAC rejection; reject unknown routes and oversized streaming bodies; reject a duplicate envelope ID across two isolates; fresh envelope with same stable *action* id must replay the stored action result, not execute again. Monitor separate envelope, quota and database-unavailable counters. Do not log envelope MACs or the raw IP.
