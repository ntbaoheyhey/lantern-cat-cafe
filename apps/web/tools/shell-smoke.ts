import { expect, type Page } from '@playwright/test';
import manifest from './screen-manifest.json' with { type: 'json' };
import { layoutFindings } from './layout-findings.mjs';

/** Shared by the live app and independent fixture: the stub cannot bypass assertions. */
export async function smokeShell(page: Page, errors: string[]) {
  const rail = page.getByTestId(manifest.shell.railTestId);
  await expect(rail).toBeVisible();
  await expect(rail.locator('[data-testid^="nav-"]')).toHaveCount(manifest.shell.navTestIds.length);
  for (const id of manifest.shell.navTestIds) await expect(rail.getByTestId(id)).toBeVisible();
  for (const screen of manifest.screens) {
    await rail.getByTestId(screen.navTestId).click();
    await expect(rail.getByTestId(screen.navTestId)).toHaveAttribute('aria-current', 'page');
    await expect(rail.locator('[aria-current="page"]')).toHaveCount(1);
    const subnav = 'subnavTestId' in screen ? screen.subnavTestId : undefined;
    if (subnav) {
      await page.getByTestId(subnav).click();
      await expect(page.getByTestId(subnav)).toHaveAttribute('aria-selected', 'true');
    }
    const hud = page.getByTestId(manifest.shell.hudTestId);
    await expect(hud).toBeVisible();
    for (const id of manifest.shell.hudTestIds) await expect(hud.getByTestId(id)).toBeVisible();
    const root = page.getByTestId(screen.screenTestId);
    await expect(root).toBeVisible();
    for (const selector of screen.required) await expect(root.locator(selector).filter({ visible: true }).first(), `${screen.id}: ${selector}`).toBeVisible();
    // Let the browser lay out the new screen before taking a geometry measurement.
    await page.evaluate(() => new Promise<void>(ok => requestAnimationFrame(() => requestAnimationFrame(() => ok()))));
    const findings = await page.evaluate(layoutFindings);
    expect(findings.documentScroll, `${screen.id}: document scrolls ${JSON.stringify(findings.dimensions)}`).toBe(false);
    expect(findings.horizontalOverflow, `${screen.id}: horizontal overflow`).toEqual([]);
    expect(findings.elementOverlap, `${screen.id}: element overlap`).toEqual([]);
    expect(errors, `${screen.id}: console/page errors`).toEqual([]);
  }
  expect(errors, 'Console/page errors after the final screen').toEqual([]);
}
