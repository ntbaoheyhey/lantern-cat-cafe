# Taskbar Hero

Taskbar Hero is an idle RPG that runs in a thin strip at the bottom of a web page. Gold, gear, shards and the Boss Key live off-chain in Supabase, where the server decides outcomes. Relic NFTs (ERC-1155) are minted on Avalanche Fuji testnet (chain id 43113) with a server-signed EIP-712 voucher, and traded on a Relic market. There is no token, and everything runs on free tiers.

Status: work in progress for Avalanche Team1 Vietnam UniHack 2026

## Credits

The A1 shell draws its placeholder hero, enemy and ground at runtime with Phaser Graphics, so there are no art files yet. Later art may come from the CC0 asset packs by Kenney (https://kenney.nl), which need no attribution but are credited here.

## Development

- `pnpm --filter @taskbar-hero/web dev` runs the web app.
- `pnpm --filter @taskbar-hero/web build` then `pnpm --filter @taskbar-hero/web test:e2e` runs the Playwright smoke test (not part of `pnpm test`).
