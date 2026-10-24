# Asset Licenses for Cat RPG v2

This document catalogues every external and internal asset source used by Cat RPG v2, detailing licensing terms, authors, and usage. It also establishes the protocol for recording any new third-party assets introduced into the codebase.

---

## Asset Inventory

| Asset Name | Category | Author / Origin | License | Local Path / Reference | Notes / Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Pixel Icons (v2)** | In-Code Pixel Art | Project Authors | Proprietary (Repository License) | [`apps/web/src/art/v2Icons.tsx`](file:///Users/bao/taskbar-hero/apps/web/src/art/v2Icons.tsx) | 25 custom pixel-art icons drawn as character matrices (materials, slot silhouettes, class weapons, chests). Scaled dynamically at 3x and 5x. |
| **UI Equipment Frames (v2)** | In-Code Pixel Art | Project Authors | Proprietary (Repository License) | [`apps/web/src/art/v2Frames.tsx`](file:///Users/bao/taskbar-hero/apps/web/src/art/v2Frames.tsx) | 15 custom 16×16 UI frames drawn in code (5 rarity borders with transparent centers, 9 empty slot watermarks, 1 locked accessory padlock frame). |
| **Character Rig & Gear Sets** | In-Code Pixel Art / Procedural | Project Authors | Proprietary (Repository License) | [`apps/web/src/game/rig/`](file:///Users/bao/taskbar-hero/apps/web/src/game/rig/) | Procedural cat paperdoll rig: body parts ([`parts.ts`](file:///Users/bao/taskbar-hero/apps/web/src/game/rig/parts.ts)), armor sets & weapons ([`gear.ts`](file:///Users/bao/taskbar-hero/apps/web/src/game/rig/gear.ts)), palettes ([`palettes.ts`](file:///Users/bao/taskbar-hero/apps/web/src/game/rig/palettes.ts)), and poses ([`poses.ts`](file:///Users/bao/taskbar-hero/apps/web/src/game/rig/poses.ts)). |
| **Monster & Boss Art** | In-Code Pixel Art | Project Authors | Proprietary (Repository License) | [`apps/web/src/art/monsters/`](file:///Users/bao/taskbar-hero/apps/web/src/art/monsters/) | Monster sprites and animation keyframe matrices (`walk`, `hit`, `defeat`, `idle`, `attack`, `windup`) validated against [`types.ts`](file:///Users/bao/taskbar-hero/apps/web/src/art/monsters/types.ts). |
| **DM Sans** | Web Font | Colophon Foundry, Jonny Pinhorn | SIL Open Font License 1.1 ([OFL-1.1](https://openfontlicense.org)) | Loaded via Google Fonts in [`apps/web/index.html`](file:///Users/bao/taskbar-hero/apps/web/index.html) | Main UI body font (`--font-body`), button labels, and descriptions. |
| **JetBrains Mono** | Web Font | JetBrains (Philipp Nurullin, Konstantin Bulenkov) | SIL Open Font License 1.1 ([OFL-1.1](https://openfontlicense.org)) | Loaded via Google Fonts in [`apps/web/index.html`](file:///Users/bao/taskbar-hero/apps/web/index.html) | Numeric HUD, timers, combat logs, stat tables (`--font-num`). |
| **Pixelify Sans** | Web Font | Stefie Justprince | SIL Open Font License 1.1 ([OFL-1.1](https://openfontlicense.org)) | Loaded via Google Fonts in [`apps/web/index.html`](file:///Users/bao/taskbar-hero/apps/web/index.html) | Display headers, stage titles, retro tab headings (`--font-display`). |
| **Third-Party Pixel Art Packs** | External Sprites | None | N/A | None yet | **None yet.** All v2 game art is original and drawn directly in code. |
| **Sound Effects & Audio** | Audio Assets | None | N/A | None yet | **None yet.** v2 contains no audio assets at this time. |

---

## How to Record a New Third-Party Asset

Before incorporating any external third-party asset (sprites, sound effects, music, or fonts) into the repository, follow this verification checklist:

### 1. License Compatibility Verification
- Only assets released under permissive licenses that allow **commercial use, redistribution, and modification** are permitted.
- Acceptable licenses:
  - **CC0 1.0 Universal** (Public Domain Dedication)
  - **MIT License**
  - **SIL Open Font License 1.1** (for fonts)
  - **CC-BY 3.0 / 4.0** (Attribution required)
- Prohibited licenses:
  - Non-Commercial licenses (**CC-BY-NC**, etc.)
  - Share-Alike licenses that contaminate the repository (**GPL**, **CC-BY-SA**)
  - Proprietary or royalty-encumbered asset store licenses that restrict redistribution in open-source repositories.

### 2. Attribution and File Placement
- If the asset requires attribution (such as CC-BY):
  - Place the original license file or notice alongside the asset (e.g. `apps/web/public/assets/<pack-name>/LICENSE.txt` or `ATTRIBUTION.md`).
  - State the exact creator name, asset title, source link, and license version.
- Prefer lossless, optimized formats (SVG or compact PNGs matching the pixel-grid scale, or string matrices in TypeScript modules following [`v2Icons.tsx`](file:///Users/bao/taskbar-hero/apps/web/src/art/v2Icons.tsx)).

### 3. Record in this Document
Add a new row to the [Asset Inventory](#asset-inventory) table above with:
1. **Asset Name**: Descriptive title of the asset or pack.
2. **Category**: Sprite, Audio, Font, Texture, etc.
3. **Author / Origin**: Original creator or organization with link to source.
4. **License**: Exact license name with a link to license terms.
5. **Local Path / Reference**: File path where the asset is committed or imported.
6. **Notes / Usage**: Where and how the asset is rendered in the game.

### 4. Technical and Style Compliance
- Pixel art assets must match the Cat RPG aesthetic:
  - Consistent pixel scale (typically 1 art pixel = 3 display pixels at standard scale).
  - 1-pixel dark outline (`#000000` / `k`) for icon clarity against dark backgrounds (`#1a1220`).
  - Palette mapping to design tokens in [`apps/web/src/theme.css`](file:///Users/bao/taskbar-hero/apps/web/src/theme.css).
- Assets must not exceed budget: verify bundle size with `pnpm --filter @taskbar-hero/web build` before committing.
