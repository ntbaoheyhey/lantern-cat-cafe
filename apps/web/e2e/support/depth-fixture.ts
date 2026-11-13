import {test as base} from '@playwright/test';

/** Returning-player checks enter the cafe before exercising its menus or battle. */
export const test = base.extend({
 page: async ({page},use) => {
  await page.addInitScript(() => {
   localStorage.setItem('lantern.entered.v3','1');
   localStorage.setItem('lantern.coach.v3',JSON.stringify({disabled:true}));
  });
  await use(page);
 },
});
