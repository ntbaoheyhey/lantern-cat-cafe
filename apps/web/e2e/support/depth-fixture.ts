import {test as base} from '@playwright/test';

/** These cases exercise a returning guest's combat/menus. Entry itself is
 * covered by shell tests and the recorded landing-to-forge journey. */
export const test = base.extend({
  page: async ({page}, use) => {
    await page.addInitScript(() => {
      localStorage.setItem('lantern.entered.v3', '1');
      localStorage.setItem('lantern.coach.v3', JSON.stringify({disabled: true}));
    });
    await use(page);
  },
});
