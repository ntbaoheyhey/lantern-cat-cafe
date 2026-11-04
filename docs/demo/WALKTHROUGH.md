# DRAFT — offline candidate walkthrough

Candidate build (stack tip `1eefc3e`), not live. This is a rehearsal script, not a contest submission or a deployed-feature claim. The supplied planning rubric totals 100: Technical 25, Avalanche Integration 25, Creativity 15, Impact 15, Pitch 10, UI/UX + Demo 10. Organizer confirmation of the rubric remains separate.

## Open in 60 seconds — Tiếng Việt

1. Mở Terminal, chạy `cd ~/taskbar-hero-demo && pnpm demo`.
2. Mở `http://localhost:5199`. Thanh trên cùng ghi rõ **Candidate build (stack tip 1eefc3e), not live**; đây không phải bản đang chạy trên website.
3. **Tour sample** mở Home với dữ liệu mẫu để xem nhanh. Bấm **Bag → Forge → Map → Market → Help**. Muốn chơi từ đầu, chọn **Scenario → Fresh guest → Play as guest**, chọn lớp rồi xác nhận.
4. Không cần ví, tài khoản hay mạng sau khi đã cài dependencies. Lần cài đầu cần pnpm cache hoặc internet. Dừng bằng **Ctrl+C**. Nếu cổng 5199 bận, tự dừng đúng server bạn đã mở; lệnh không tự tắt tiến trình khác.
5. Muốn xem ngay không cài gì: nhấp đúp `~/taskbar-hero-demo/docs/demo/taskbar-hero-demo/index.html`. Đây là bản xem ảnh có điều hướng, **không phải game tương tác**. Dùng **← / →**, **Next**, hoặc bấm menu trong ảnh.

## Open in 60 seconds — English

1. Run `cd ~/taskbar-hero-demo && pnpm demo`, then open `http://localhost:5199`.
2. Read the candidate banner. **Tour sample** is a labeled local fixture, not a signed-in account. Use **Bag → Forge → Map → Market → Help** to explore.
3. For ordinary first play: **Scenario → Fresh guest → Play as guest → Start Adventure as Warrior → Confirm**. The class name in the first button follows your current selection. Home starts the normal local claim loop.
4. Node 22.12+ and pnpm 10.28.0 are required for the launcher; the first install needs cached dependencies or internet. Once installed, runtime is offline. Stop with **Ctrl+C**.
5. With no setup, double-click `docs/demo/taskbar-hero-demo/index.html`: a self-contained screenshot walkthrough. Use the arrows, Next/Previous, step buttons or rail hotspots. To play the included production bundle, run `python3 -m http.server 5199 --bind localhost --directory docs/demo/dist` from the repository root.

## Three-minute Demo Day click path

Rehearse at 1440×900. Start in **Tour sample** and click **Restart scenario** before recording. Keep the candidate banner visible throughout. This path deliberately identifies every supplied fixture. For the single-file fallback, use the corresponding numbered step instead of pretending a screenshot button performs the action.

| Time | Exact clicks in the runnable demo | What to say | What the screen proves / rubric |
| --- | --- | --- | --- |
| 0:00–0:25 | **Scenario → Tour sample**, **Home**. Let the hunt animate. | “Taskbar Hero is a cozy idle RPG beside your work. Start with a cat, an understandable next goal and no wallet. This is the local candidate, not the live site; the displayed progression is a sample.” | The actual candidate shell, hunt scene, HUD and next goal render together. **Creativity 15, Impact 15, UI/UX + Demo 10.** No adoption or retention claim. |
| 0:25–0:45 | **Bag**, click the first stored **Twig Sword** item. Inspect the **Twig Sword** detail panel. | “The player can inspect equipment and compare it with the current loadout. These are sample game items, not NFT balances.” | Inventory and comparison UI use the same item catalog and rules as the candidate. **Technical 25, UI/UX + Demo 10.** |
| 0:45–1:10 | **Forge → Craft**. Leave **Weapon (Sword)** and **Common** selected. Click **Craft Common Weapon (Sword)**, then the confirmation's **Confirm Craft** action. | “The cost is visible before spending. This craft is real local gameplay against sample materials; it is not a blockchain transaction.” | Confirmation, item creation and material deduction execute locally. The browser receipt verifies the item count and Fish spend. **Technical 25, UI/UX + Demo 10.** |
| 1:10–1:35 | **Scenario → Boss sample** (opens **Map**). Click **Fight**, then **Skip fight** after the arena appears. Show **Victory!**. Reload once to leave the result. | “This separate sample supplies the boss prerequisites. Combat resolves through local rules; the animation shows that result. A win consumes a sample key and advances the chapter.” | Boss gate, arena and result path run locally. Skip skips presentation, not the rule outcome. **Creativity 15, Technical 25.** |
| 1:35–2:00 | **Market**. Do not open a wallet or explorer. | “Ordinary equipment stays in the game. Optional Relics use ERC-1155 on Avalanche Fuji, with an escrow market for test AVAX. This offline preview does not invent ownership or listings.” | The integration boundary and configured contract references are visible. Transactions are unavailable. **Avalanche Integration 25.** |
| 2:00–2:25 | **Help → Guide**, type **Forge** into **Search help**, then click the **Forge** topic. | “The guide stays inside the game, explains the rules and makes unavailable actions clear. Future rune, skill and companion samples remain off.” | Searchable help and navigation work in the real candidate. **Impact 15, UI/UX + Demo 10.** |
| 2:25–3:00 | **Help → On-chain proof**. Show chain **43113** and both addresses. | “These are documented Fuji contract addresses, not fresh chain proof. Offline mode makes no RPC or signing requests. The next release still needs deployment capacity and separate backend release gates. This demonstration proves a reviewable local candidate, not a new deployment.” | Honest evidence boundaries and a concrete next step. **Avalanche Integration 25, Pitch 10.** |

The static fallback's seven steps follow the same story, but Boss shows the Tour sample map and all captures are frozen. Its caption discloses that the browser check separately completed the Boss sample fight. Do not describe hotspot clicks as gameplay.

## What is real vs mocked

| Surface / fact | Real evidence in this package | Mocked, unavailable or not proven |
| --- | --- | --- |
| Candidate identity | Source stack `1eefc3ef6d828b06710c8be18feb08e90b099e3e`; #270 documentation `932b6f7` merged locally; demo branch adds offline-only controls. | No release. Live baseline remains `340f88b`. Final demo commit and exact checked heads are recorded in the report. |
| Home, Bag, Forge, Boss, Help | Actual React/Phaser UI, original repository art and shared deterministic game rules. Crafting, boss result and fresh reward are executed by the local browser check. | MockGameApiV2 replaces the server. Tour/Boss levels, materials, equipment and prior progress are supplied fixtures; they have no account value. |
| Fresh guest | Ordinary unchosen class and initial state. The real 30-second local claim loop generates the first reward without test-clock acceleration. | Guest saves are browser data, not trusted backend state. No server synchronization occurs. |
| Static HTML | Eight actual scale-2 PNG captures from the runnable demo, embedded with their hashes. Navigation, keyboard and zoom work offline. | A screenshot click-through, not a full embedded game. No screenshot action mutates game state. |
| Avalanche network | Documented Fuji testnet chain ID **43113**. Existing integration source is present in the candidate. | No RPC calls or fresh network verification in this demo; no mainnet or real-funds claim. |
| Relic contract | **RelicNFT / ERC-1155:** `0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D`. Address matches `packages/chain/deployments/43113.json` and the pinned judge packet. | Bytecode, recent events, balances and fresh mint receipts are unavailable offline. A contract address alone does not prove a transaction journey. |
| Market contract | **RelicMarket:** `0x10fcC46e439d3E31Fb1720B337C45CadB9b2ff93`. Existing source describes escrow trading in test AVAX. | No listing, buying, cancellation, approval, signature or ownership lookup. Market is explicitly an unavailable preview. |
| Authentication and backend | Existing architecture and tests are available for source review. | No Supabase URL/key is consumed; no live DB, migration or edge deployment. #269 edge source remains undeployed. No signed-in simulation is presented as a real account. |
| Rune / skill / companion previews | Existing original preview designs remain in source, labeled **Sample / Unavailable**. | Their shared flag is **OFF** by default and was not enabled for this demo; no ownership, rank, bonus or active feature is claimed. |
| Tests and release | New execution receipts name the tests actually run, the checked heads and limitations. | Historical stack self-grades or 399/399 results are not new demo results. No Vercel deployment or contest submission occurred. |

## 90-second screen-recording shot list — DRAFT

Use the runnable demo at 1440×900, system audio off, no wallet UI, no browser extensions, and keep the candidate banner readable. Record your own narration; no third-party audio. These are planned shots, not a claim that a new recording was produced.

| Time | Shot / exact action | Narration cue |
| --- | --- | --- |
| 0:00–0:10 | **Home**, Tour sample; hold the candidate banner and moving hunt scene. | “Local candidate, not live. A cozy idle game; this progress is a sample.” |
| 0:10–0:23 | **Bag → first Twig Sword**; show comparison details. | “Inspect and compare ordinary game equipment.” |
| 0:23–0:38 | **Forge → Craft → Craft Common Weapon (Sword) → Confirm Craft**. | “Visible costs and a real local craft, using sample materials.” |
| 0:38–0:55 | **Scenario → Boss sample → Fight → Skip fight**; hold **Victory!**. | “Supplied prerequisites, local combat rules, visible result.” |
| 0:55–1:08 | Reload, then **Market**; keep the offline preview explanation in view. | “Relics are optional. No fake listings and no transactions.” |
| 1:08–1:20 | **Help → Guide**, search **Forge**; briefly show the topic. | “Answers stay within the game.” |
| 1:20–1:30 | **On-chain proof**; show chain 43113, both contracts and the unavailable-offline note. | “Documented Fuji integration, no new chain proof or deployment claim.” |

For a first-play evidence clip, record **Fresh guest** separately and continuously through its natural first reward. Do not splice sample progression into that clip. The three-minute script and 90-second plan are targets to rehearse, not measured narration durations.
