<!-- Text export of the approved UI draft (index.html, tab "Design brief"). Living draft. -->

# Taskbar Hero UI redesign: design brief (living draft v0)

Status: draft for the user's review. Nothing here is final. Game rules, contracts, auth, schema (Tier 3) are untouched. Desktop first, no mobile work yet.

## 1. Goals

- Art rule (user, 31 Oct): Keep ALL existing images and art assets (sprites, backgrounds, icons, cat art, Relic art). Reuse them as they are; never replace or delete any. New art only as additions, and only if the user asks. The mockup's simple placeholder cats and icons are stand-ins only; the real build uses the current art folders.

- A full-screen web app that feels like one cozy cat cafe at night, not a strip of tabs.

- Judges (Technical + Avalanche Integration) see on-chain proof fast: Fuji badge, Relic id, contract link, Routescan.

- Every screen has one primary action and one place to look first.

- Keep pixel-art identity and the existing tokens in apps/web/src/theme.css.

## 2. Reference (inspiration only, no copied assets, text or code)

tbhindex.com blocked automated access from our environment (Cloudflare), so the structure below comes from the user's description of it: a persistent left navigation, data-dense list/detail screens, and a clear split between a data index and the game. The user should confirm which parts of that site they like (see decision list in the report).

## 3. Information architecture and navigation

Model: persistent left rail (7 entries) + top HUD + content + optional right context panel.

- Landing (before play, no rail) -> Class picker (first run only) -> Home.

- Rail: Home, Bag, Map, Forge, Market, Hero, Help. Fuji status badge at the bottom.

- HUD (always): Gold, Shards, Cat Keys, level + XP bar, Power, wallet button.

- Mapping from today's tabs: Hero tab -> Home (stage) + Hero (sheet); Inventory -> Bag; Boss -> Map; Forge -> Forge; Market -> Market. Help becomes a screen, not a modal.

- Right panel pattern: list/grid on the left, detail + actions on the right. Actions never live inside the list.

## 4. Screens

1. Landing: hero scene, promise, Play as guest, Connect wallet (secondary), proof strip.

2. Class picker: three cards, one selected, one primary button.

3. Home (stage): living scene, hero card, next goal, recent loot, event log.

4. Bag: 8-column grid with visible empty slots, filters, detail + compare panel.

5. Map (boss): winding path with nodes, fight card (recommended power, daily attempts, rewards, past runs).

6. Forge: pick gear, materials, chances table, reveal in the centre pane.

7. Market: Relics only, sortable table, on-chain facts + Routescan link, your listings.

8. Hero: paper-doll equipment, stats, power breakdown, change class.

9. Help: topic list + answer, search.

10. Shared states: confirm modal, toasts (success, warning, failure), offline banner, empty bag.

## 5. Design tokens (extends theme.css)

- Colour: bg #120b19 (new, rail/page) over #1a1220, surfaces #2a1f36 / #3a2c4a / #4a3a5e, border #72578d, text #fff3e0, muted #c3aed0, accent #ffb86b. Semantic: good #6be08a, bad #ff6b6b, shard #8fd8ff, key #ff8fb1. Rarity: common #b9b6c9, rare #4aa8ff, epic #bb74ff, legendary #ff9a3c.

- Type: Pixelify Sans (headings, buttons, labels), DM Sans (body, 14px base), JetBrains Mono (all numbers, tabular).

- Spacing: 4 / 8 / 12 / 16 / 24 / 32. Screen padding 16-18px, card gap 14px.

- Frames: 2px border + 3px hard black shadow on cards and buttons; buttons press down 2px. Rarity = frame colour AND a text pill.

- Frame sizes: design at 1280x720 and 1600x900. Rail 92px, HUD 56px, right panel 320-340px. Content flexes.

- Motion: only hit numbers, loot pop, forge flash. All respect prefers-reduced-motion.

## 6. Components

Rail nav item, HUD chip, XP bar, Card, Button (primary/secondary/ghost/large), Pill, Item slot (+ empty, selected, rarity), Item icon set, Stat row, Data table, Scene canvas wrapper, Event log, Map node, Modal, Toast, Banner, Empty state, Search field, Filter chips, Progress bar.

## 7. Open questions for the user

- Keep Pixelify Sans, or try a more readable pixel face for long text?

- Is the left rail OK, or prefer top tabs like today?

- Should Home also show a mini boss progress, or keep it only on Map?
