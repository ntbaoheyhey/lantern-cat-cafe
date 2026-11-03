# Submission pack — DRAFT, not submitted

Prepared for the owner; this is not a contest entry or an approval to publish. The repository stays private. Organizer criteria, deadline, submission URL, team details and private judge-access arrangements remain owner-confirmed placeholders.

## Project and pitch

**Taskbar Hero** is a desktop idle RPG with a cat adventurer. Guest play runs locally in the browser; authenticated play uses server-owned state and shared rules. Everyday play needs no on-chain transaction. Earned Relics can use an EIP-712 voucher mint and an ERC-1155 escrow market on Avalanche Fuji. There is no separate ERC-20 game currency and no mainnet claim.

The current guest UI offers three starter classes, a broader seven-class registry, five chapters, nine equipment slots, a 200-slot bag, gear crafting and a public proof panel. In v2, the first daily claim grants a Cat Key; a boss win spends one. The daily Relic recipe is 30 Yarn plus 1 Moon Pearl, not the classic Cat-Key recipe. Configuration remains the source of these values.

Help's local catalog preview starts OFF. Its 12 stats, 15 item examples, 5 qualities and 7 skills are draft content, not live inventory or activated server behavior. The original-economy flag remains false. New 34-icon provenance is recorded; historical art evidence has limits described below.

## Avalanche integration

| Resource | Verified address/link | Evidence boundary |
|---|---|---|
| Live frontend | [Taskbar Hero](https://taskbarhero-eight.vercel.app) | Last packet media snapshot 6144d42; recheck after UI readiness |
| Network | Avalanche Fuji, 43113 | Free test AVAX only |
| RelicNFT | [0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D](https://testnet.routescan.io/address/0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D/contract) | ERC-1155 voucher mint; deployed-code presence is not source certification |
| RelicMarket | [0x10fcC46e439d3E31Fb1720B337C45CadB9b2ff93](https://testnet.routescan.io/address/0x10fcC46e439d3E31Fb1720B337C45CadB9b2ff93/contract) | Fixed-price escrow in test AVAX |
| Source | [Private repository](https://github.com/ntbaoheyhey/taskbar-hero) | No visibility change; owner confirms permitted reviewer access |
| Video | OWNER TO INSERT after recording/verification | Do not invent a recording URL |

The public Help panel reads code, Market→NFT linkage, active listings and a bounded recent-event window. RelicNFT does not expose a totalSupply getter; do not infer lifetime supply from recent events. A read-only snapshot is not a mint/list/buy receipt. Fresh funded wallet proof is NOT VERIFIED in this packet. No private key or seed should be shared for review.

## Criteria mapping (provisional, no invented weights)

The requested Technical and Avalanche Integration axes are used below. Additional categories are presentation aids, not a claim about the organizer's final rubric.

| Evaluation angle | What to show | Evidence / current limit |
|---|---|---|
| Technical | Shared rules, auth/ownership, atomic retries, bounded requests, regression evidence | [Security overview](security-overview.md), [test matrix](security-test-matrix.md); local checks do not prove deployed backend identity |
| Avalanche Integration | Exact Fuji contracts, EIP-712 mint/reconciliation, escrow flow, public proof panel | [Contracts](contracts.md), [proof screenshot](../reports/submission/screenshots/fuji-read-only-1280x720.png); fresh funded receipts pending |
| Product usability | Landing→guest→class→idle→Map→Forge→Bag→proof→Market | [Demo script](video-script.md); timed live run waits for UI's CXU3/CXC2 readiness |
| Original content | Draft economy catalog and 34 original code-drawn icons | [Asset provenance](../reports/asset-provenance.md); original-economy default OFF |
| Honesty and reproducibility | Separate guest, local-server and live-chain evidence; disclose missing work | [Evidence manifest](../reports/submission/evidence/media-manifest.json), [release receipt](../reports/submission/evidence/6144d42-acceptance.json) |

## Current evidence and omissions

The archived 6144d42 acceptance records 2,490 package unit cases, 323 browser cases per desktop size, 40 art checks, 35 asset hashes matching before/after, 22 health checks and 16 guest/read-only stages per size. These version-specific numbers belong to that exact historical release; they are not a current run of a later UI head. Two expected game-rule failures and eleven inherited skips are disclosed in the receipt.

CXQ1's complete timed path and fresh throwaway Fuji mint/list/buy are pending. SYSTEM stopped preparation when the scope addendum required waiting for UI readiness. The current official faucet requires a connected wallet and Builder Hub login. No wallet/private key, funding request or transaction was created by SYSTEM.

PR #244 remains unmerged because a complete deployed Supabase source/dependency/import-map backup and tested restore path are unavailable. UnsafeFunctionDownloadPathError was not bypassed. No backend deployment, migration, production flag change or live policy certification is claimed. UI refreshes belong to the separate UI session; consult its board before refreshing this packet.

## Licensing and media review

Project code declares [MIT](../LICENSE); dependencies keep their own licenses. The existing font inventory declares OFL1.1. [Canonical provenance](art/PROVENANCE.md) explicitly distinguishes Git history from independent proof of historical authorship/licensing; the older blanket “zero unknown origins” claim is not adopted here. Historical prompts/model versions remain unknown where unrecorded. The 34 new icons have concrete code/tool/date/recipe/hash evidence.

Packet PNGs are unchanged copies of verified live guest captures, not newly generated art. Their hashes and original paths are in the manifest. The Map image shows a locked gate; the proof image is read-only; the catalog image is an opt-in local preview. Do not label any as a boss win, owned NFT, live balance entitlement or transaction receipt. No third-party artwork was added.

## Owner-only completion steps

Confirm organizer rules/deadline/team details and a permitted private source-access route. After UI readiness, refresh screenshots and execute the timed demo, then obtain actual throwaway Fuji receipts if the wallet prerequisite is satisfied. Record the [145-second video draft](video-script.md), check every subtitle/claim against the final release, and fill the video URL. Review the [nine-slide outline](pitch-slides.md). Submission, invitations, publication and repository visibility changes are not performed by this task.
