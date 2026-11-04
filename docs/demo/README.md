REFERENCE: `reports/SINGLE2-REPORT.md` at ledger `10cbae7`; `docs/ui/gallery/index.html` at gallery `f5c0a0c`; `reports/ui-redesign/index.html`; `apps/web/tools/ui-audit.mjs`; `apps/web/tools/effects-test.mjs`; `docs/proposals/rune-skill-system/demo/index.html`; `docs/submission/` at #270 `932b6f7`. These are provenance references, not copied third-party art.

# Taskbar Hero offline demo — candidate, not live

Stack tip: `1eefc3ef6d828b06710c8be18feb08e90b099e3e`. The demo branch locally includes #270 documentation (`932b6f7`) and an offline launcher/wrapper. The banner identifies the source stack, not a deployed release. The live baseline remains `340f88b`; this demo does not update it. **Do not merge this branch.**

## Open it on this Mac

```sh
cd ~/taskbar-hero-demo && pnpm demo
```

Open **http://localhost:5199**. Stop with **Ctrl+C** in that terminal. The port is fixed and the command refuses to start if it is busy; it never terminates another process.

Prerequisites: Node.js 22.12+ (or 24+) and pnpm **10.28.0**. The launcher checks both and runs `pnpm install --frozen-lockfile --prefer-offline` if Vite is missing. A first dependency install requires the pnpm cache or internet. **After installation, the app runs offline using only loopback assets; no backend, RPC, wallet or remote font is used.** The build ignores `.env*` files and inherited `VITE_*` values. Do not supply credentials.

The initial **Tour sample** has labeled level 20 / chapter 2 progress, a loadout, inspectable Bag items and crafting materials. The **Scenario** menu also offers **Boss sample** (ready for a local fight) and **Fresh guest** (unchosen class, ordinary starting state). **Restart scenario** resets only the selected demo scenario. Changing scenarios replaces the local demo save; it does not touch the normal guest save or authenticate a wallet. Browser storage being unavailable falls back to memory for the current page.

## Double-click, no server

Open `~/taskbar-hero-demo/docs/demo/taskbar-hero-demo/index.html` in Finder, or:

```sh
open ~/taskbar-hero-demo/docs/demo/taskbar-hero-demo/index.html
```

This is a **guided click-through of real local screenshots**, not the playable Phaser game. All eight captures, styles and scripts are embedded in one file. It works from `file://` with networking disabled. Use **Next / Previous**, **← / →**, **Home / End**, the step buttons or the hotspots on the screenshot's navigation rail. **Enlarge capture** opens a readable full-size view; Escape closes it. The Home step can switch between the two captured desktop sizes.

The unmodified production module bundle cannot run directly from `file://`: the browser rejects module/CSS loading with a null origin. That failure was actually reproduced; see `reports/demo/file-bundle-probe.json`. No unsafe browser flags are needed for the guided file.

## Included playable production bundle

The versioned `docs/demo/dist/` is a production build of the offline mode. From the repository root, serve it without installing Node packages:

```sh
python3 -m http.server 5199 --bind localhost --directory docs/demo/dist
```

Open **http://localhost:5199**. Stop any demo server you started first; both commands use port 5199. The directory must be the server root because existing game asset URLs are root-relative. No Vercel service is involved.

## Reproduce the artifacts and checks

```sh
pnpm demo:build
# In a separate terminal while pnpm demo is running:
pnpm demo:check --shots
pnpm demo:static
node scripts/demo-static-check.mjs
```

`demo:check` runs Chromium at 1280×720 and 1440×900, device scale 2, with all non-loopback requests blocked and `navigator.onLine` false. It verifies each requested screen, offline contract references, default-off feature previews, crafting, a boss fight, fresh class choice and a natural first reward. It also injects a fake wallet and an old session to ensure they are ignored. The static check opens the single HTML with the browser offline and exercises navigation, hotspots and zoom. These checks use local fixtures and do not prove live server or chain behavior.

Screenshots and their SHA-256 hashes are in `shots/manifest.json`. Raw receipts, exact tested heads and final limitations are in `reports/demo/` and the ledger's `reports/demo/DEMO-REPORT.md`. Do not present the historical 399-test stack receipt as a new run of this demo.

## Boundaries

- The real candidate UI, original repository art and shared game rules run locally; sample progression is labeled.
- Wallet discovery, reconnection, signing and RPC transport are disabled. Market is an unavailable preview; Help shows documented Fuji addresses without fresh reads. External proof links in the runnable demo show an offline notice instead of navigating.
- Rune, skill and companion previews remain **Sample / Unavailable** behind their existing **default-OFF** flag. No feature flag or economy value was changed.
- System fonts replace remote Google Fonts in this dedicated build, so lettering differs from the live site. Normal builds retain their existing font and wallet behavior.
- This branch carries Vercel Git auto-deployment exclusions for the demo and ledger branch names, at repository and web roots. The existing ignored-build command is preserved. No deployment, quota probe, migration, live database write or merge to main is part of this task.
- Total demo payload must stay below **25,000,000 bytes**, counting the static HTML, production bundle, PNGs and documentation together. See the final report for measured sizes.

Use the [DRAFT walkthrough](WALKTHROUGH.md) for the bilingual opening guide, three-minute Demo Day path, real-versus-mocked table and 90-second recording plan. Nothing has been submitted to a contest.
