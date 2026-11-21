# Web app security and secrets check

Status update (2026-10-26, S2): historical review retained; hash/link/approval fixes and the tightened blocking CSP are implemented and tested; mock-auth remains proposal-only. See [current security review](security-review-2026-10.md) and [S2 evidence](https://github.com/ntbaoheyhey/lantern-cat-cafe/blob/d89b61ab3ddd73659f45158d1abe5835b9445b81/reports/s2-security.md).

Scope: `apps/web` as built and served from Vercel, plus the browser side of the wallet and sign-in flow. Reviewed against main at the time of writing. This is a read-only review: no app code changed. Auth fixes are a core change and need the owner's review; the others are small follow-ups.

## 1. Secrets in the production bundle

`scripts/check-bundle.mjs` scans a built `dist` for secret-looking strings. It builds nothing itself.

```sh
pnpm --filter @taskbar-hero/web build
node scripts/check-bundle.mjs            # defaults to apps/web/dist; or pass a directory
```

Exit codes: `0` clean, `1` at least one hit (each hit is listed, masked), `2` the directory is missing.

What counts as a hit:

- Server-only variable names (the fixed list in the script plus every non-`VITE_` name in `.env.example`), for example `SUPABASE_SERVICE_ROLE_KEY`, `VOUCHER_SIGNER_PRIVATE_KEY`, `DEPLOYER_PRIVATE_KEY`.
- A JWT whose payload role is `service_role` or `supabase_admin`, or any JWT that is not the public anon key. The anon key is reported as a note only.
- `sb_secret_…` keys, PEM private key blocks, GitHub, AWS and Slack token formats.
- The words "mnemonic", "seed phrase", "recovery phrase".
- A 64-hex value right after "private", "secret", "signer" or "deployer".
- The actual values of secret-looking variables found in local `.env*` files or the process environment.
- Any `VITE_` variable named like a secret, because Vite ships every `VITE_` variable to the browser.

Bare 64-hex strings are not hits. The web3 chunk legitimately holds curve constants and contract bytecode, so flagging them would make the script unusable. The words "private key" alone are also not hits; viem uses them as identifiers.

**Result on a fresh production build** (`rm -rf apps/web/dist && pnpm build`): 21 text files scanned, no hits, exit 0. A manual grep agreed: no `eval(`, `new Function(`, workers, JWTs or `sb_*` keys. The only URLs are Core wallet, Snowtrace, the Fuji RPC and library doc links.

**Negative test:** a copy of `dist` with a planted `SUPABASE_SERVICE_ROLE_KEY` string and a `private key 0x<64 hex>` value exits `1` with both listed. A missing directory exits `2`.

Suggested use: run it in CI after the web build (not wired up here, because the card limits this change to the script and this note).

## 2. Findings

Severity is for this app today: a testnet game with no fungible token.

| # | Severity | Finding | Smallest fix |
|---|----------|---------|--------------|
| 1 | Medium | No security headers. `apps/web/vercel.json` only has `ignoreCommand`. There is no CSP, so any future injection becomes script execution, and the site can be framed (clickjacking on the sign and mint buttons). | Add a `headers` block, see section 3. |
| 2 | Medium | The mock auth API accepts any signature and is chosen when `VITE_SUPABASE_URL` is unset (`wallet/authApi.ts`). If a deploy ever loses that variable, the site silently runs in mock mode. | Make `defaultAuthApi` throw in production builds (`import.meta.env.PROD`) when the URL is missing. **Auth is core; needs review.** |
| 3 | Low | The session token is in `sessionStorage` (`wallet/session.ts`). That is the better choice over `localStorage` (cleared when the tab closes), but it is readable by any script on the page. | Mitigated by the CSP in section 3; no code change needed. |
| 4 | Low | `forge/TodayRelicCard.tsx` builds the Snowtrace link from `today.txHash` as received from the server, without the `^0x[0-9a-fA-F]{64}$` check that `mintStore.ts` uses. The host is fixed, so it cannot become a `javascript:` link, but a bad value gives a broken or misleading path. | Run the hash through the same regex inside `txUrl`. |
| 5 | Low | Two links use `rel="noreferrer"` without `noopener` (`ForgeTab.tsx`, `WalletButton.tsx`). Modern browsers imply `noopener` for `_blank`, so this is cosmetic. | Use `rel="noopener noreferrer"` to match `TodayRelicCard`. |
| 6 | Low | `MarketTab` asks for `setApprovalForAll(market, true)` before the first listing. That is unlimited approval of all Relics to the market contract, which is the normal ERC-1155 pattern, but the wallet prompt does not say so in plain words. | Add a one-line explanation next to "Approving the market…". Optional. |
| 7 | Info | Dependency audit (`pnpm audit --prod`): 7 advisories (3 high, 4 moderate) in `ws`, `zod`, `uuid` and `decode-uri-component`. All come through `wagmi > @wagmi/connectors` optional wallet SDKs (WalletConnect, Coinbase, Gemini). The app only uses the injected connector, and these are server or relay-side libraries. Not confirmed whether any of that code is in the shipped chunk. | Revisit when wagmi is next upgraded; consider `pnpm.overrides` for the patched versions. |
| 8 | Info | Google Fonts is loaded from `fonts.googleapis.com`, a third-party request on every visit that leaks the visitor's IP to Google. | Self-host the font files if privacy matters. |

Checked and fine:

- **XSS:** no `dangerouslySetInnerHTML` or `innerHTML` in `apps/web/src`. Relic names and values render as React text. Relic images use `/relics/${id}.svg` from this site, not a URL from chain or JSON metadata.
- **Window and links:** no `window.open`. Every external link has a fixed host.
- **Local storage:** only a "help seen" flag and the unreported mint hash (regex-validated on read). No tokens.
- **Sign-in message:** `wallet/siwe.ts` uses `window.location.host` as the SIWE domain and `window.location.origin` as the URI, chain 43113, a 10-minute expiry and a plain statement. The server must check that domain against an allowlist (a core auth item, so recorded here and not changed).
- **Wallet flows:** wrong-chain state shows a "switch to Fuji" button (`useSwitchChain`); every contract call passes `chainId: FUJI_CHAIN_ID`.
- **Build:** no source maps, no `define` or `envPrefix` leakage in `vite.config.ts`. Only `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` and `VITE_FUJI_RPC_URL` reach the client, and the anon key is public by design.

## 3. Recommended headers for `apps/web/vercel.json`

Keep the existing `ignoreCommand` and add:

```json
"headers": [
  {
    "source": "/(.*)",
    "headers": [
      { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self' https://api.avax-test.network https://*.supabase.co wss://*.supabase.co; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'" },
      { "key": "X-Content-Type-Options", "value": "nosniff" },
      { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
      { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
    ]
  }
]
```

Tested: this CSP was served on a local copy of the fresh build and loaded in Chromium. The Phaser canvas rendered and the console showed no CSP violations. Not tested: a real wallet connection and a live Supabase call under the policy. If `VITE_FUJI_RPC_URL` points to another host, add it to `connect-src`. Roll it out with `Content-Security-Policy-Report-Only` first if you want zero risk.

`'unsafe-inline'` for styles is needed for React inline `style` attributes; scripts stay strict, which is the part that matters.

## 4. Follow-ups (not done here)

- Headers block in `vercel.json` (finding 1): done, see `apps/web/vercel.json`. Check live response headers after the deploy.
- Run `check-bundle.mjs` in CI after the web build.
- Findings 4, 5 and 6 as one small polish PR.
- Findings 2 and the SIWE domain allowlist go to the owner as core auth items.
