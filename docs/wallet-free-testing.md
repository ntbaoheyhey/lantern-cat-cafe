# Wallet-free testing

All three modes run only locally or in CI. None adds code to a production build, and
`apps/web/src/wallet/prodBundle.test.ts` builds production and fails if mock sign-in is present
(the C4 guard in `authApi.ts` is unchanged). The live account and live Supabase are never touched.

| Mode | What it is | Use it for |
| --- | --- | --- |
| Demo | No Supabase env: the app uses `MockGameApiV2` in browser localStorage, seeded from `mockV2Fixtures.ts` (`fresh`, `bossReadyStrong`, `bossReadyWeak`, `forgeRich`, `bagNearFull`, `midGame`). | Fast layout and state checks. |
| Signed-in local | `scripts/local-server.mjs`: loopback PGlite running the real Edge Function logic and migrations, plus a flag-on build pointed at it. A locally minted session is placed in `sessionStorage` (`/__test/session`, kinds `fresh`, `stocked`, `strong`, `weak`, `equip`). | Sign-in state, claim, craft, salvage, boss, equip, retry and race paths. |
| Mock auth | `VITE_ALLOW_MOCK_AUTH=1` build (demo/e2e only). | Wallet button flow without a real signature. |

## Commands (from `apps/web`)

```
node tools/ui-audit.mjs ../../reports/ui-audit bossReadyStrong      # demo, screenshots of every tab at 1280x720 and 390x844
node tools/ui-audit.mjs ../../reports/ui-audit-signed stocked --signed-in   # signed-in local server
pnpm exec playwright test --project=v2-server                       # 11 end-to-end journeys against the local server
```

The audit script prints automatic findings (document scroll, console errors) and writes PNGs per tab,
including Forge Craft, Salvage and Relic.

## Not testable without a wallet

Relic voucher mint and Market list/buy need an on-chain signature. The UI states before that point
(no wallet refuses before spending, listings view) are covered; the transaction itself needs the user's wallet.
