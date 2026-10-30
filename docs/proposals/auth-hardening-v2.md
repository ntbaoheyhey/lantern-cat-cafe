# Auth hardening v2 — proposal only

S2 does not change authentication, sign-in, secrets or deployments. These sketches require the auth owner's review and tests. The production demo-build policy needs an explicit decision before applying the first change: today's browser suite deliberately builds without a backend.

## Missing backend must fail closed in production

IMPLEMENTED (U-1): `defaultAuthApi` returns a blocked API (every call rejects) for a production build with no `VITE_SUPABASE_URL`, unless the build sets `VITE_ALLOW_MOCK_AUTH=1` (used by the e2e demo builds). Tests: `apps/web/src/wallet/authApi.test.ts`. The sketch below threw instead; a blocked API was chosen so the app still renders.

CONFIRMED: [apps/web/src/wallet/authApi.ts:35](../../apps/web/src/wallet/authApi.ts#L35) accepts mock verification, and [apps/web/src/wallet/authApi.ts:53](../../apps/web/src/wallet/authApi.ts#L53) selects it whenever the public backend URL is missing. A user can otherwise mistake a production mock session for server authentication. This does **not** make a mock token valid at the real Edge Functions.

Replace only the selector when approved:

```ts
export function defaultAuthApi(): AuthApi {
  if (import.meta.env.VITE_SUPABASE_URL) return createHttpAuthApi();
  if (import.meta.env.PROD) throw new Error('Production sign-in requires VITE_SUPABASE_URL');
  return createMockAuthApi();
}
```

Tests: production + missing/empty URL throws before offering sign-in; production + configured URL uses HTTP; development may use mock. Explicitly inject `createMockAuthApi()` into an approved, visibly labelled demo entry point and browser fixtures rather than allowing the production selector to silently downgrade. Never ship a private key or a real bearer token in a fixture.

## Server-side SIWE domain allowlisting

NOT REPRODUCIBLE as a missing-domain-check vulnerability: [packages/auth/src/index.ts:175](../../packages/auth/src/index.ts#L175) already compares the signed domain with `config.domain`; line 177 checks the URI host, HTTPS (loopback HTTP exception), and absence of credentials. [supabase/functions/_shared/auth.ts:46](../../supabase/functions/_shared/auth.ts#L46) obtains that domain from required `SIWE_DOMAIN`, not a request header. Keep the single exact server domain for one deployment. Do not derive it from Origin, Host, the submitted message, or CORS.

If multiple production/preview domains are needed, use a server-owned exact set, never a suffix wildcard. Sketch for an approved replacement of the existing checks:

```ts
// Build once at server startup from an owner-controlled setting, not from the request.
function domainAllowlist(raw: string): ReadonlySet<string> {
  const domains = raw.split(',').map(value => value.trim().toLowerCase()).filter(Boolean);
  if (!domains.length) throw new Error('SIWE domain allowlist is empty');
  for (const domain of domains) {
    const url = new URL(`https://${domain}`);
    if (url.host !== domain || url.pathname !== '/' || url.username || url.password ||
        url.search || url.hash) throw new Error('Invalid SIWE domain');
  }
  return new Set(domains);
}
// Inside verifySignIn after canonical parsing, before nonce redemption:
const domain = f.domain.toLowerCase();
if (!allowedDomains.has(domain)) throw new AuthError('wrong_domain');
if (!uriMatchesDomain(f.uri, domain)) throw new AuthError('wrong_uri');
```

Tests: exact allowed host/port; unrelated host, `allowed.example.attacker.example`, credentials, deceptive URI and wildcard-like values refused; nonce remains unused for failed signatures/domain checks; simultaneous redemption succeeds once. Configure production and preview independently. Live `SIWE_DOMAIN`, CORS origins, JWT secrets and deployed auth bundles remain NOT VERIFIED; S2 made no live request.

## Other auth boundaries

The v2 server chooses `SUPABASE_JWT_SECRET` ahead of `AUTH_JWT_SECRET` ([supabase/functions/_shared/v2/server.ts:17](../../supabase/functions/_shared/v2/server.ts#L17)), matching the auth wiring. Confirm which issuer/verifier secret is actually used before deployment; the README's assumption of a separate application signing key is not deployment evidence. Prefer one explicit application-secret name, refuse ambiguous conflicting settings, rotate sessions on any compromise, and never log bearer headers. Do not change this precedence blindly in a game route.

Auth wrappers still parse bodies without a byte cap ([supabase/functions/auth-verify/index.ts:9](../../supabase/functions/auth-verify/index.ts#L9)); the new v2 reader does not cover them. Reuse the bounded reader design with a 4 KiB auth limit and strict object validation before parsing, while preserving 2,048-character message and 65-byte signature checks. Add anonymous trusted-IP nonce/verification budgets before signature recovery, and a per-wallet issuance budget after signature recovery; see [rate limiting](rate-limit-v2.md). Return generic errors and never log raw signed messages/signatures. Nonces have no browser owner to justify client SELECT/INSERT: use the [server-only RLS proposal](sql/siwe-nonces-rls.sql).

The verified JWT `sub` is the game identity, but wallet signatures establish a key holder, not a unique human. Per-IP quotas reduce abuse; they do not prove personhood. A bounded, single-use invite scheme for new accounts is an optional separate product decision. Session revocation and a global emergency issuance switch remain future work; no auth implementation was changed here.
