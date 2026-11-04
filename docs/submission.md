# Submission pack — DRAFT, not submitted

Prepared for the owner; this is not a contest entry or an approval to publish. The repository stays private. Organizer criteria, deadline, submission URL, team details and private judge-access arrangements remain owner-confirmed placeholders.

## Project and pitch

**Taskbar Hero** is a desktop idle RPG with a cat adventurer. Guest play runs locally in the browser; authenticated play uses server-owned state and shared rules. Everyday play needs no on-chain transaction. Earned Relics can use an EIP-712 voucher mint and an ERC-1155 escrow market on Avalanche Fuji. There is no separate ERC-20 game currency and no mainnet claim.

The current guest UI offers three starter classes, a broader seven-class registry, five chapters, nine equipment slots, a 200-slot bag, gear crafting and a public proof panel. In v2, the first daily claim grants a Cat Key; a boss win spends one. The daily Relic recipe is 30 Yarn plus 1 Moon Pearl, not the classic Cat-Key recipe. Configuration remains the source of these values.

Help's local catalog preview starts OFF. Its 12 stats, 15 item examples, 5 qualities and 7 skills are draft content, not live inventory or activated server behavior. The original-economy flag remains false. New 34-icon provenance is recorded; historical art evidence has limits described below.

## Avalanche integration

| Resource | Verified address/link | Evidence boundary |
|---|---|---|
| Live frontend | [Taskbar Hero](https://taskbarhero-eight.vercel.app) | Live baseline 340f88b; integrated candidate 1eefc3e is not deployed; see the dated [release evidence](release-status.md); refresh again after the held stack lands |
| Network | Avalanche Fuji, 43113 | Free test AVAX only |
| RelicNFT | [0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D](https://testnet.routescan.io/address/0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D/contract) | ERC-1155 voucher mint; deployed-code presence is not source certification |
| RelicMarket | [0x10fcC46e439d3E31Fb1720B337C45CadB9b2ff93](https://testnet.routescan.io/address/0x10fcC46e439d3E31Fb1720B337C45CadB9b2ff93/contract) | Fixed-price escrow in test AVAX |
| Source | [Private repository](https://github.com/ntbaoheyhey/taskbar-hero) | No visibility change; owner confirms permitted reviewer access |
| Video | OWNER TO INSERT after recording/verification | Do not invent a recording URL |

The public Help panel reads code, Market→NFT linkage, active listings and a bounded recent-event window. RelicNFT does not expose a totalSupply getter; do not infer lifetime supply from recent events. A read-only snapshot is not a mint/list/buy receipt. Fresh funded wallet proof is NOT VERIFIED in this packet. No private key or seed should be shared for review.

## Requested rubric and presentation drafts

This packet maps to the supplied planning rubric (100 points). The owner still confirms organizer rules and the official deadline.

| Criterion | Points | Demonstration and evidence |
| --- | ---: | --- |
| Technical | 25 | Shared deterministic rules, server-owned state, RLS/RPC boundaries, repeatable integration gate; [security overview](security-overview.md) |
| Avalanche Integration | 25 | Fuji 43113, EIP-712 intended-caller mint, ERC-1155 Relics, escrow market, public read-only proof; [60-second verification](submission/avalanche-proof.md) |
| Creativity | 15 | Cozy desktop cat RPG, original coordinate-drawn icons/frames, bounded optional feature samples; [asset provenance](../reports/asset-provenance.md) |
| Impact | 15 | Guest entry without wallet friction, clear recovery and no transaction for ordinary play; measured accessibility and onboarding, no invented adoption figures |
| Pitch | 10 | [3-minute script](submission/pitch-3-minute.md), [judge FAQ](submission/judge-faq.md), explicit limits |
| UI/UX + Demo | 10 | [90-second shot list](submission/shot-list-90-second.md), both-size captures and keyboard paths, current candidate distinguished from live |

All four new presentation documents are drafts. No recording, upload, contest entry or private-review invitation is implied.

## Current evidence and omissions

The [November 4 release status](release-status.md) separates current main/live `340f88b`, integrated local candidate `1eefc3e`, its exact test receipts and historical failures. The candidate incorporates the held UI/auth drafts plus #271 Salvage contrast and Landing geometry repairs. The current-main regression (1,448 web units and 368 browser cases per size) is historical baseline evidence, not the final stack count. No final-stack live acceptance is claimed.

The archived 6144d42 acceptance records 2,490 package unit cases, 323 browser cases per desktop size, 40 art checks, 35 asset hashes matching before/after, 22 health checks and 16 guest/read-only stages per size. These version-specific numbers belong to that exact historical release; they are not a current run of a later UI head. Two expected game-rule failures and eleven inherited skips are disclosed in the receipt.

The current guest route has been audited at both desktop sizes, including a natural first reward and saved-guest return. This does not prove a fresh-to-boss win, a complete recorded video, or fresh throwaway Fuji mint/list/buy; those remain pending. The earlier UI-readiness stop is historical. The current official faucet requires a connected wallet and Builder Hub login. No wallet/private key, funding request or transaction was created by SYSTEM.

PR #244 remains unmerged because a complete deployed Supabase source/dependency/import-map backup and tested restore path are unavailable. UnsafeFunctionDownloadPathError was not bypassed. No backend deployment, migration, production flag change or live policy certification is claimed. The release order and current candidate/live distinction are recorded in [release evidence](release-status.md). Draft #269 includes edge source that remains undeployed even after a future frontend release.

## Licensing and media review

Project code declares [MIT](../LICENSE); dependencies keep their own licenses. The existing font inventory declares OFL1.1. [Canonical provenance](ui/art/PROVENANCE.md) explicitly distinguishes Git history from independent proof of historical authorship/licensing; the older blanket “zero unknown origins” claim is not adopted here. Historical prompts/model versions remain unknown where unrecorded. The 34 original icons and 33 additive UI drawings have concrete code/tool/date/recipe/hash evidence. ART2 runtime images stay behind the default-OFF flag.

The original packet PNGs are unchanged historical live guest captures. Refreshed SINGLE2 PNGs are local candidate evidence with their own manifest and explicit fixture labels; they are not live captures or newly generated art. Filenames identify completed QA phases; the class-phase image shows Home immediately after confirmation. Their hashes and original paths are in the manifest. The Map image shows a locked gate; the proof image is read-only; the Hero image is local guest equipment. Do not label any as a boss win, owned NFT, live balance entitlement or transaction receipt. No third-party artwork was added. A catalog capture with apparently blank icon areas was excluded pending UI verification; it is not used as final art-integration evidence.

## Owner-only completion steps

Confirm organizer rules/deadline/team details and a permitted private source-access route. After deployment capacity is verified and the held stack is released, refresh screenshots and execute the final timed demo, then obtain actual throwaway Fuji receipts if the wallet prerequisite is satisfied. Use the [90-second candidate shot list](submission/shot-list-90-second.md) and [3-minute pitch](submission/pitch-3-minute.md); the [145-second video draft](video-script.md) remains a historical alternative, check every subtitle/claim against the final release, and fill the video URL. Review the [nine-slide outline](pitch-slides.md). Submission, invitations, publication and repository visibility changes are not performed by this task.

Planning dates: November 21, 2026 (UTC+7) is the owner's planning deadline; Demo Day is November 30. The official submission deadline is unconfirmed; Builder Hub has been reported as November 25 at 05:59 without a confirmed timezone here. The owner must confirm it with the organizer and submit personally.
