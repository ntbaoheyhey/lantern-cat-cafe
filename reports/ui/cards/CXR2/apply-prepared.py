#!/usr/bin/env python3
"""Apply this session's prepared CXR2 UI-only repair after CXU3 is released."""
from pathlib import Path
import shutil
import subprocess

root = Path.cwd()
assert root == Path('/Users/bao/taskbar-hero-ui')
branch = subprocess.check_output(['git', 'branch', '--show-current'], text=True).strip()
assert branch.startswith('ai/codex-ui-cxr2')
here = Path(__file__).resolve().parent
subprocess.run(['git', 'apply', '--3way', str(here / 'inherited-ui.patch')], check=True)

def edit(path, old, new):
    target = root / path
    text = target.read_text()
    assert text.count(old) == 1, (path, old, text.count(old))
    target.write_text(text.replace(old, new))

# The Relic tests seed a prior visit; re-read the same help store before rendering.
path = 'apps/web/src/game/stage/relicWiring.ui.test.tsx'
edit(path, "import { StageLayout } from '../../layout/StageLayout';", "import { StageLayout } from '../../layout/StageLayout';\nimport { resetHelpForTests } from '../../onboarding/helpStore';")
edit(path, "vi.clearAllMocks(); localStorage.clear(); localStorage.setItem('taskbar-hero.howToPlaySeen', '1');", "vi.clearAllMocks(); localStorage.clear(); localStorage.setItem('taskbar-hero.howToPlaySeen', '1');\n  act(() => resetHelpForTests());")

# Preserve all accessibility assertions, targeting the actual portalled dialogs.
path = 'apps/web/src/layout/a11y/v2-loot.a11y.test.tsx'
edit(path, "{ cleanup, fireEvent, render, screen }", "{ cleanup, fireEvent, render, screen, within }")
edit(path, "const { container } = render(<ChestReveal {...chestRevealProps({ firstClear: false })} />);\n      const icon = container.querySelector('.chest-reveal-icon-wrap svg');", "render(<ChestReveal {...chestRevealProps({ firstClear: false })} />);\n      const icon = screen.getByRole('dialog').querySelector('.chest-reveal-icon-wrap svg');")
edit(path, "const { container } = render(<ChestReveal {...chestRevealProps({ onDone })} />);", "render(<ChestReveal {...chestRevealProps({ onDone })} />);")
edit(path, "const title = container.querySelector('.chest-reveal-title');", "const title = within(dialog).getByRole('heading', { level: 2 });")
edit(path, "const { container } = render(<WelcomeBack {...welcomeBackProps({ onClose })} />);", "render(<WelcomeBack {...welcomeBackProps({ onClose })} />);")
edit(path, "const title = container.querySelector('.welcome-back-title');", "const title = within(dialog).getByRole('heading', { level: 2 });")
edit(path, "fireEvent.keyDown(document, { key: 'Tab', shiftKey: false });\n      expect(document.activeElement).toBe(okBtn);\n      fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });\n      expect(document.activeElement).toBe(okBtn);", "const scroll = screen.getByRole('region', { name: 'Scrollable offline loot' });\n      fireEvent.keyDown(document, { key: 'Tab', shiftKey: false });\n      expect(document.activeElement).toBe(scroll);\n      fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });\n      expect(document.activeElement).toBe(okBtn);")

path = 'apps/web/src/onboarding/HowToPlay.tsx'
edit(path, "document.querySelector<HTMLElement>('button.toggle, [aria-controls=\"game-panel\"]')", "document.querySelector<HTMLElement>('button.toggle, [aria-controls=\"game-panel\"], [data-testid=\"landing-start\"], [data-testid=\"class-picker-choose-button\"], [data-testid=\"nav-home\"]')")

path = 'apps/web/src/layout/forge/ForgePanel.tsx'
edit(path, 'Odds read directly from game-rules configuration.', 'Each daily Relic uses these same chances.')

path = root / 'apps/web/src/layout/loot/loot.css'
path.write_text(path.read_text() + '''
/* The desktop game uses its night palette for shared loot dialogs in every OS theme. */
:root .ui-modal.loot-dialog { background: var(--surface); color: var(--text); border-color: var(--accent); color-scheme: dark; }
:root .ui-modal.loot-dialog .ui-modal-heading h2,
:root .ui-modal.loot-dialog .loot-summary-heading { color: var(--accent); text-shadow: none; }
:root .ui-modal.loot-dialog .welcome-back-duration,
:root .ui-modal.loot-dialog .loot-item-name { color: var(--text); }
:root .ui-modal.loot-dialog .welcome-back-rule,
:root .ui-modal.loot-dialog .loot-item-meta { color: var(--muted); }
:root .ui-modal.loot-dialog .loot-line,
:root .ui-modal.loot-dialog .loot-item-tile,
:root .ui-modal.loot-dialog .chest-reveal-icon-wrap { background: var(--surface-2); color: var(--text); border-color: var(--border); }
:root .ui-modal.loot-dialog .loot-item-rarity-common { color: var(--rarity-common); }
:root .ui-modal.loot-dialog .loot-item-rarity-uncommon { color: var(--good); }
:root .ui-modal.loot-dialog .loot-item-rarity-rare { color: var(--rarity-rare-text); }
:root .ui-modal.loot-dialog .loot-item-rarity-epic { color: var(--rarity-epic-text); }
:root .ui-modal.loot-dialog .loot-item-rarity-legendary { color: var(--rarity-legendary); }
:root .ui-modal.loot-dialog .chest-reveal-scrim { background: rgb(18 11 25 / .88); }
.ui-modal.loot-dialog .loot-item-name { white-space: normal; overflow: visible; text-overflow: clip; overflow-wrap: anywhere; }
''')

path = root / 'apps/web/src/layout/forge/ForgePanel.css'
path.write_text(path.read_text() + '''
/* Match the approved framed side groups without shrinking labels or artwork. */
@media (min-width: 961px) {
  .forge-card { min-width: 0; padding: 12px; border: 2px solid var(--border); background: var(--surface); box-shadow: var(--pixel-shadow); }
  .forge-card > .forge-section-title { margin-bottom: 8px; }
  .forge-col-left .forge-options-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .forge-col-left .forge-slot-btn, .forge-col-left .forge-rarity-btn { padding: 6px 4px; border-width: 2px; }
  .forge-col-left .forge-selector-group + .forge-selector-group { margin-top: 8px; }
}
''')

path = root / 'apps/web/src/shell/shell.css'
path.write_text(path.read_text() + '''
/* Keep full large currency values in the HUD; wrap digits rather than hide or shrink them. */
@media (min-width: 961px) {
  .shell-hud .hud-chip-val { max-inline-size: 11ch; white-space: normal; overflow-wrap: anywhere; text-align: right; }
  .v2-hint { border-radius: 0; }
}
''')

path = 'apps/web/e2e/ui/cxr2-dialogs.spec.ts'
edit(path, "await expect(dialog).toBeVisible(); await expect(dialog).toHaveClass(/ui-modal/);", "await expect(dialog).toBeVisible(); await expect(dialog).toHaveClass(/ui-modal/);\n  await expect(dialog).toHaveCSS('background-color', 'rgb(42, 31, 54)');")
edit(path, "await expect(page.getByTestId('landing-start')).toBeEnabled();", "await expect(page.getByTestId('landing-start')).toBeEnabled();\n        await expect(page.getByTestId('landing-start')).toBeFocused();")
shutil.copy2(here / 'cxr2-state-matrix.spec.ts.txt', root / 'apps/web/e2e/ui/cxr2-state-matrix.spec.ts')
print('Prepared CXR2 changes applied; run targeted checks and inspect screenshots before freezing.')
