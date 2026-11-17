# Environment audit classification
Static names inventory is complete for direct process/import.meta/Deno reads plus known env/localPort wrappers. Six dynamic sites remain listed explicitly; no values inspected.

| Names | Classification | Runbook wording needed |
|---|---|---|
| AUTH_JWT_SECRET / SUPABASE_JWT_SECRET | Session-signing configuration; AUTH fallback is needed where platform refuses SUPABASE-prefixed secret updates | Name the existing setting and fallback; keep matching JWT verification across all functions. |
| VOUCHER_SIGNER_PRIVATE_KEY | Existing contract-authorized signer; required when reward/mint functions enabled | Name it exactly and check presence in Secrets without printing/exporting. |
| SPONSOR_PRIVATE_KEY | Optional dedicated sponsor; source falls back to voucher signer | Explain override/fallback and public sponsor-address consistency. |
| SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY | Hosted Supabase injects platform wiring; source readers require them | Identify as platform-provided; do not export service-role key to Vite. |
| VITE_SUPABASE_ANON_KEY | Optional API client header in current source; runbook says preserve anon key generically | Spell out public setting name and retain only if required by gateway. |
| BASE_URL,DEV,MODE,PROD | Vite built-ins | No user configuration required. |
| VITE_CRAFT_PILOT,VITE_GAME_V2,VITE_RELIC_FORGE_ADDRESS | Optional feature/development routing; forge disabled by deployment flags | Do not enable accidentally; document intentionally off if a complete matrix is desired. |
| CHAIN_COSMETICS_ENABLED,CHAIN_SEAL_PRICE_TRIAL | Optional backend switches; standard seal policy expected and cosmetics disabled | Existing deployment state must agree with disabled frontend features. |
| GAME_SEED_SECRET | Optional dedicated game seed; falls back to the configured JWT secret | Label optional; retain existing value or the documented JWT fallback. |

No assertion that the currently hosted secret configuration is missing or invalid. QA-1 concerns reproducibility of the guide from a fresh operator context.
