# Taskbar Hero — Lantern Cat Café

![Mochi casts Last Lantern Vow](docs/submission/media/hero.gif)

[Watch the 51-second demo recording](art/trailer/v9/battle_v5-m2.5.mp4) · [View the six-frame contact sheet](art/trailer/v9/contact_sheet_v5-m2.5.png)

The GIF and silent video were captured from `v5-m2.5`. The video shows the street wave and boss journey; the planned three-minute trailer with sound remains separate.

The Lantern Cat Café is the last lit shop on a street tangled by abandoned tasks. Lead Mochi, Clover and Soot through a street patrol and face the Yarn Giant in a cosy browser card RPG. In the configured Avalanche mode, café memories become Relics that players can own on Fuji.

**Latest integrated build:** [v5-m2.8](https://github.com/ntbaoheyhey/taskbar-hero/tree/v5-m2.8), with self-contained release assets, refreshed V9 backend maps and reliable CLI receipt handling. It includes the v5-m2.6 submission media, CC-BY boss music replacement, complete delivered sound credits, V9 audio packaging and faster CI change detection. The [v5-m2.2 recording baseline](https://github.com/ntbaoheyhey/taskbar-hero/tree/v5-m2.2) remains published, with all three ultimate sequences and layered sound playback.

## Play in three steps

Use Node 24 and pnpm 10.28.0. The local demo needs no account, wallet setup or test tokens.

1. Clone the release branch and install its dependencies:

   ```sh
   git clone --branch release/2026-11-21 https://github.com/ntbaoheyhey/taskbar-hero.git
   cd taskbar-hero
   pnpm install --frozen-lockfile
   ```

2. Build and launch the local preview:

   ```sh
   node tools/v5int/run-chain-mode.mjs --fixture
   ```

3. Open [Lantern Cat Café on port 6301](http://127.0.0.1:6301/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3). Choose **Play free → Guard the café → Face the Yarn Giant**. Keep the complete URL: the bare URL opens an older shell.

The three cats fight automatically at 1× speed. Mochi protects the team, Clover heals, and Soot delivers the final boss ultimate. The seeded journey has one street wave followed by the Yarn Giant; all twelve cats appear in Collection, while only the three demo cats enter these battles. **Play again** repeats the journey, and `&legacy=1` keeps the earlier game available.

The `--fixture` launch shows an explicitly labelled receipt preview after victory: no transaction or ownership is claimed. Collection can still read real Fuji balances for a public wallet address. For the owner-configured backend, sponsored guest funding and a real mint, follow [RUN-CHAIN-MODE.md](docs/RUN-CHAIN-MODE.md) and launch the same command without `--fixture`.

## How Avalanche is used

Combat runs off-chain using shared deterministic TypeScript rules. The server independently runs the fixed trial and controls reward entitlement; an editable browser save is never mint authority.

- **Guest sign-in:** a browser wallet signs a SIWE message, and Supabase validates the session.
- **Sponsored entry:** an owner-funded sponsor sends test AVAX through `guest-drip`. The guest wallet pays its own mint gas using those funds; this is a funded-EOA flow.
- **Boss reward:** after victory, the configured UI requests the existing finale voucher for **Relic #3, Moon Collar**, then submits `RelicNFT.mint`. The EIP-712 voucher binds the recipient, chain, contract, nonce and expiry, and the nonce prevents reuse.
- **Visible proof:** a successful receipt shows the full transaction hash, **Avalanche Fuji**, actual fee payer, AVAX fee and Snowtrace link.
- **Independent Collection:** the browser calls ERC-1155 `balanceOfBatch` directly on Fuji at one block. No backend or sign-in is required for this read; **Owned on Avalanche Fuji** appears only after a successful response.
- **Wider contract system:** ERC-20 YARN, markets and seasonal claims support the larger game. They are separate from the short three-cat judge journey and require their matching configured services.

All addresses below are on **Avalanche Fuji, chain ID 43113**, from the [versioned deployment registry](packages/chain/deployments/43113.json). Source verification was confirmed on 19 November 2026 using Foundry and Routescan, without an API key or a new deployment.

| Contract | Purpose | Verified source |
| --- | --- | --- |
| RelicNFT | ERC-1155 Relics and signed-voucher minting | [0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D](https://testnet.snowtrace.io/address/0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D/contract/43113/code) |
| RelicMarket | Legacy AVAX escrow market | [0x10fcC46e439d3E31Fb1720B337C45CadB9b2ff93](https://testnet.snowtrace.io/address/0x10fcC46e439d3E31Fb1720B337C45CadB9b2ff93/contract/43113/code) |
| YarnToken | ERC-20 YARN | [0x3ae1b898c1Ded263b30D968D26Fe65211f102d6b](https://testnet.snowtrace.io/address/0x3ae1b898c1Ded263b30D968D26Fe65211f102d6b/contract/43113/code) |
| RelicMarketV2 | AVAX/YARN trading and seller proceeds | [0x6Fe415494D791E63d87613B8FBCdbb24743C7eb4](https://testnet.snowtrace.io/address/0x6Fe415494D791E63d87613B8FBCdbb24743C7eb4/contract/43113/code) |
| SeasonRewards | Signed seasonal reward claims | [0x29d4F1b9d4577BF2bA5c6bdB849CA5fdc9bd6c11](https://testnet.snowtrace.io/address/0x29d4F1b9d4577BF2bA5c6bdB849CA5fdc9bd6c11/contract/43113/code) |

### Three real Fuji transactions

These successful **historical gameplay transactions from 12 November 2026** were read back from Fuji RPC on 19 November. The destination contracts, decoded methods and receipt events confirm minting, listing and buying Relic #3. They show the existing on-chain flow; the fresh V9 sponsored reward-mint recording remains owner-dependent.

| Transaction | Receipt | Block |
| --- | --- | ---: |
| Mint Moon Collar, Relic #3 | [0x1cd4a1fb…261b8](https://testnet.snowtrace.io/tx/0x1cd4a1fb0fbe78a95893608b0435b9b720e9191c5287137f64696a519c9261b8) | 60,934,447 |
| List Relic #3 for 0.001 AVAX | [0x899ed5c5…83636](https://testnet.snowtrace.io/tx/0x899ed5c516b2909764f34143b6568711a8f94e61cccd1b6b551e0878e3b83636) | 60,934,457 |
| Buy that listing | [0x9662228f…7fddd](https://testnet.snowtrace.io/tx/0x9662228f168bd5080907f49bd3a01d735f91b620d5468c7778a362b74ec7fddd) | 60,934,461 |

## Architecture

```mermaid
flowchart LR
  Rules[Shared deterministic rules] --> UI[React UI and Three.js battle]
  Rules --> API[Supabase auth and chain judge]
  UI -->|SIWE and reward request| API
  API --> Ledger[(Entitlements and used nonces)]
  API -->|Signed voucher| Wallet[Browser guest wallet]
  Sponsor[Owner-funded sponsor] -->|Guest drip: test AVAX| Wallet
  Wallet -->|Mint transaction| Fuji[Avalanche Fuji contracts]
  UI -->|Read-only balanceOfBatch| Fuji
  Fuji -->|Receipt and ownership| UI
```

The browser owns presentation and wallet interaction, Supabase owns authenticated issuance decisions, and Fuji owns token settlement. Collection reads the chain directly. See [ARCHITECTURE.md](docs/ARCHITECTURE.md) and the [chain-mode run guide](docs/RUN-CHAIN-MODE.md) for service boundaries and configuration.

## Stack and repository map

The judge experience uses **Vite, React, TypeScript and Three.js**, with Spine/native rigs and video-texture idles. Shared game rules drive the seeded combat. **Supabase Edge Functions and Postgres**, SIWE, viem and Solidity contracts built with Foundry support the optional Avalanche mode. Phaser remains in legacy code; it does not draw the V9 judge battle.

| Path | Contents |
| --- | --- |
| `apps/web/` | Game UI, Three.js presentation, audio, wallet flow and public media |
| `packages/game-rules/` | Shared deterministic battle rules and V9 demo setup |
| `packages/chain/` | ABIs, Fuji addresses and chain helpers |
| `packages/auth/` | Authentication/session contracts |
| `supabase/` | Edge Functions and database migrations |
| `contracts/` | Solidity contracts, deployment scripts and Foundry tests |
| `tools/v5int/` | Local launch, verification and integration smoke tools |
| `tools/v9/` | Designer-idle conversion and original Blender VFX generation |
| `docs/` | Architecture, run guides, submission material and credits |

## Validation and current limits

The integration gate is a production build, TypeScript check, focused tests for changed code and a real browser demo run on port 6301. The `v5-m2.2` recording baseline passed 152 focused tests; the `v5-m2.3` matte/effects update passed 27 affected tests, the `v5-m2.5` reviewer update passed 10 affected tests, and `v5-m2.6` passed 101 focused audio/demo tests. The `v5-m2.7` release tree passed its production build, workspace typecheck/lint, 11 affected UI/demo tests and five import-map generator tests; all 25 Edge Function maps resolve and regenerate without changes. CI change detection was also checked using real shallow Git clones for docs-only, web and manual-run cases. The full m2.7 workspace suite passed 5,579 tests (11 skipped and two expected failures); m2.8 adds nine focused receipt/move tests, 33 campaign tests and 14 passing local chain preflight commands. The latest headless browser run against the release build completed the boss in 21.0 seconds at normal speed with Mochi, Clover and Soot's ultimates. All twelve ultimate sound layers played and all eight Blender flipbooks loaded. The same run checked Collection against live Fuji RPC, the labelled receipt fixture and the legacy route, with no page errors. This is a local playback observation, not a general hardware benchmark.

```sh
pnpm --filter @taskbar-hero/web typecheck
pnpm --filter @taskbar-hero/web build
node tools/v5int/v9-demo-smoke.mjs --chain-ui --v9-deliveries --v9-recording
```

Build the fixture mode with the launch command above before using the `--chain-ui` smoke option. Run contract tests separately with Foundry after initializing the repository submodules.

The three ultimates and their sound layers are integrated. The hero GIF, a silent demo recording and six 1920×1080 screenshots are available. Final designer exports remain pending; Soot still uses its fallback rig, while Mochi/Clover use corrected temporary videos. Visual acceptance remains with the owner and visual lane. A configured/deployed Supabase backend, funded sponsor and fresh real-mint screenshot remain owner work.

## Submission screenshots

[Title](docs/submission/media/title.png) · [Three-cat squad](docs/submission/media/squad.png) · [Mochi cut-in](docs/submission/media/cutin.png) · [Impact](docs/submission/media/impact.png) · [Receipt fixture](docs/submission/media/mint-toast.png) · [Fuji Collection read](docs/submission/media/collection.png)

The receipt screenshot is explicitly a **fixture**, with no submitted transaction or explorer link. The Collection screenshot shows a successful Fuji read for an empty wallet. Neither screenshot is proof of a new mint.

## Credits

- **Character art and idle animation:** original project art and commissioned designer work for Mochi, Clover and Soot. Temporary Mochi/Clover conversions remain labelled as stand-ins until the final exports arrive.
- **V9 effects:** original Blender geometry, shaders and animation authored for the project; no OMG 3Q art or sound is included.
- **Battle music:** “RPG - To Arms! Battle Music 1” by HitCtrl, [source](https://opengameart.org/content/rpg-to-arms-battle-music-1), CC-BY 3.0; transcoded for browser playback.
- **Boss music:** “Volatile Reaction” by Kevin MacLeod (incompetech.com), [source](https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1400039), licensed under [Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/). Cropped and transcoded for browser playback.
- **Music and sound attribution:** [submission credits](docs/submission/CREDITS.md), [V9 music licences](apps/web/public/audio/v9/LICENSES.json), [existing audio provenance](apps/web/public/audio/LICENSES.json) and [project credits](docs/credits-v4.md). The twelve S2 ultimate layers and three shared sounds derive from Kenney Impact Sounds and RPG Audio under CC0; per-cue sources are listed in the submission credits.
- **Art provenance:** [project asset record](docs/art/PROVENANCE.md). Project code is [MIT licensed](LICENSE); media and dependencies retain their stated licences.
