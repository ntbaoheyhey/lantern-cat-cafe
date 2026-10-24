# UI guide

Cat Café Quest is Taskbar Hero's cozy dusk, pixel-art cat theme. Presentation changes must preserve game rules, numbers, contracts, database fields, API shapes, internal ids, existing class names and `data-testid` values. The [display-name table](game-rules.md#display-names) maps technical terms to the names players see.

## File layout

Paths below are relative to `apps/web/src/`.

| Location | Purpose |
| --- | --- |
| [theme.css](../apps/web/src/theme.css) | Theme tokens and shared presentation classes. |
| [theme/labels.ts](../apps/web/src/theme/labels.ts) | `LABELS` and `bossName(level)` for display text. |
| [art/pixelIcons.tsx](../apps/web/src/art/pixelIcons.tsx) | String-map pixel icons rendered as SVG. |
| [main.tsx](../apps/web/src/main.tsx) | App entry point; loads `styles.css`, then `theme.css`. |
| [App.tsx](../apps/web/src/App.tsx), [Panel.tsx](../apps/web/src/Panel.tsx), [styles.css](../apps/web/src/styles.css) | Page shell, tabs and shared layout. |
| [game/](../apps/web/src/game), [GameCanvas.tsx](../apps/web/src/GameCanvas.tsx) | Phaser strip, HUD and client game state. |
| [inventory/](../apps/web/src/inventory), [boss/](../apps/web/src/boss), [forge/](../apps/web/src/forge), [market/](../apps/web/src/market) | Feature components, text helpers, styles and tests. |
| [onboarding/](../apps/web/src/onboarding), [wallet/](../apps/web/src/wallet) | Help, next-step hints and wallet UI. |

The motion foundation is `motion/reducedMotion.ts`, `motion/useTickNumber.ts` and `motion.css` (see below).

## Tokens and shared classes

Use `var(--token)` from `theme.css` instead of hardcoding a color that already has a token. Keep the shared stylesheet and label definitions under their owning task; request a missing token from that owner.

| Tokens | Use |
| --- | --- |
| `--bg`, `--surface`, `--surface-2`, `--border` | Page background, cards, raised surfaces and borders. |
| `--text`, `--muted` | Primary and secondary text. |
| `--accent`, `--on-accent` | Primary controls and their text. |
| `--gold`, `--shard`, `--key` | Resource colors; token names retain the internal vocabulary. |
| `--good`, `--bad`, `--focus` | Outcomes and keyboard focus. |
| `--rarity-common`, `--rarity-rare`, `--rarity-epic`, `--rarity-legendary` | Rarity accents. |
| `--font-display`, `--font-body`, `--font-num` | Pixelify Sans headings, DM Sans body text and JetBrains Mono numbers. |
| `--pixel-border`, `--pixel-shadow` | Shared pixel borders and shadows. |

Reuse `.pixel-card` for panels, `.pixel-btn` for primary buttons and `.chip` for compact resource badges. Rarity text classes are `.rarity-common`, `.rarity-rare`, `.rarity-epic` and `.rarity-legendary`. Add these alongside existing classes without removing selectors used by the app or tests.

Keep text contrast at least 4.5:1 against its actual background. Preserve `:focus-visible` outlines and use `--focus` for their color. Check layouts at 320, 390 and 1280px wide for overlap and horizontal scrolling.

## Display labels

Import `LABELS` for resource, hero, gear-slot, rarity and Relic names. Use `bossName(level)` for the boss name; it cycles the configured display names by level. Do not rename `LABELS` keys or tab identifiers as part of a presentation task.

For example, from a component in `inventory/`:

```tsx
import { LABELS } from '../theme/labels';
import { PixelIcon } from '../art/pixelIcons';

<span className="chip">
  <PixelIcon name="fish" size={3} />
  {gold} {LABELS.gold}
</span>
```

The state field stays `gold`; only the visible label changes.

## Pixel icons

`PixelIcon` accepts `name`, optional `size` (default `3`, screen pixels per art pixel) and optional `title`. Available names are `paw`, `bag`, `sword`, `flask`, `shop`, `fish`, `yarn`, `key`, `wand`, `ears`, `collar`, `bell`, `moon` and `heart`.

Icons are decorative (`aria-hidden`) by default. When an icon conveys meaning without adjacent text, provide a `title` for an accessible image name. An icon-only button also needs an accessible name on the button itself. The SVG uses `crispEdges` and block display; arrange it with text using a flex container such as `.chip`.

To add an icon in a task that owns `art/`:

1. Add a named array of pixel rows to `MAPS` in `art/pixelIcons.tsx`. Each character selects a color from `PALETTE`; use `.` for transparent pixels. Prefer consistent row widths.
2. Reuse palette entries and theme variables. Coordinate any missing theme token with its owner before introducing a new color.
3. `IconName`, `ICON_NAMES` and the SVG paths derive from `MAPS`; no separate registration is needed.
4. Update the explicit icon list in [pixelIcons.test.tsx](../apps/web/src/art/pixelIcons.test.tsx). Its shared tests check dimensions, crisp rendering and accessibility; keep the map within the tested bounds (5–12 pixels wide, 4–12 high), or adjust those checks deliberately if the design requires it.
5. Render the icon at an integer `size`, inspect it with the surrounding text and run the web tests and build.

## Motion and reduced motion

The shared motion API is:

| API | Purpose |
| --- | --- |
| `usePrefersReducedMotion()` from `motion/reducedMotion.ts` | Read the user's motion preference. |
| `useTickNumber(value, ms = 400)` from `motion/useTickNumber.ts` | Animate a displayed number; keep the underlying game value unchanged. |
| `.fx-press`, `.fx-float`, `.fx-pop` from `motion.css` | Button press, floating reward text and card entrance effects. |

Reuse these helpers; `main.tsx` already loads `motion.css`.

Every new animation must include a `@media (prefers-reduced-motion: reduce)` fallback. For JavaScript-driven effects, honor the preference in code too. Show the final state immediately and preserve all information and actions when motion is reduced. For example:

```css
@media (prefers-reduced-motion: reduce) {
  .reward-reveal {
    animation: none;
    transition: none;
    opacity: 1;
    transform: none;
  }
}
```

## Checks

From the repository root, run:

```sh
pnpm install
pnpm --filter @taskbar-hero/web test
pnpm --filter @taskbar-hero/web build
pnpm --filter @taskbar-hero/web test:e2e
```

Build before E2E: Playwright serves the production preview. Keep existing tests passing, changing text assertions only when a player-facing label changes. Include desktop (1280px) and mobile (390px) screenshots in UI pull requests, and verify the 320px layout as well.
