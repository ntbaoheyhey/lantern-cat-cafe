import { test as base, expect } from '@playwright/test';
import { classicURL, v2URL } from './servers';

export { expect } from '@playwright/test';
export type { Locator, Page } from '@playwright/test';

/** Import this test in specs so a misplaced file or baseURL override fails loudly. */
export const test = base.extend<{ buildGuard: void }>({
  buildGuard: [async ({ page, baseURL }, use, testInfo) => {
    const directory = testInfo.file.match(/[/\\]e2e[/\\](ui|layout|v2|qa)[/\\]/)?.[1];
    const v2 = directory !== undefined;
    const expectedProject = v2 ? (directory === 'v2' ? 'v2-loop' : 'stage-layout') : 'classic';
    expect(testInfo.project.name, 'Spec is assigned to the wrong build project').toBe(expectedProject);
    expect(baseURL, 'Use the project baseURL; do not override it in a spec').toBe(v2 ? v2URL : classicURL);
    const goto = page.goto.bind(page);
    let checked = false;
    page.goto = async (...args) => {
      const response = await goto(...args);
      // The arena and art-pilot developer previews intentionally render outside StageLayout.
      // Its project and origin are still checked above. Check the first normal page.
      const devParam = new URL(page.url()).searchParams.get('dev');
      if (!checked && devParam !== 'arena' && devParam !== 'art-pilot') {
        await expect(page.getByRole('heading', { level: 1, name: 'Taskbar Hero' })).toBeVisible();
        await expect(page.locator('[data-game-v2="stage-v2-enabled"]'),
          `Expected the ${v2 ? 'v2' : 'classic'} build at ${baseURL}`).toHaveCount(v2 ? 1 : 0);
        checked = true;
      }
      return response;
    };
    await use();
  }, { auto: true }],
});
