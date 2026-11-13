# Decisions

- 2026-11-13: User final decisions win: free audio only; planner economy; automatic pilot review; local CI; user deploys 20 Nov. No agents.
- Saved 658 paused CHAIN files at 86093b682 and pushed; workspace typecheck and chain package 32/32 pass. Old evidence logs have whitespace, retained unchanged.
- Merged integration base and CHAIN; combined demo:play with isolated chain:test, retained latest CHAIN screenshots. No code conflicts remained.
- .env.example and supabase/.temp excluded from commits.
- User allows partial after two methods with four repairs per method; report unmet gates honestly.
- Kenney download repair: unsigned URL and token request without browser headers failed. Cookie/referer-aware official downloader succeeds; use this method for all four packs.
- SeasonRewards has immutable SEASON_LENGTH=13 weeks and BASE_ROUTINE_CAP=12; game seasons use four-week windows but vouchers use contract.currentSeason(). The 25% withdrawal fee stays in pool, not an on-chain burn.
