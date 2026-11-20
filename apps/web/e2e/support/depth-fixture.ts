import {test as base} from '@playwright/test';

/** Returning-player checks enter the cafe before exercising its menus or battle. */
export const test = base.extend({
 page: async ({page},use) => {
  await page.addInitScript(() => {
   localStorage.setItem('lantern.entered.v3','1');
   localStorage.setItem('lantern.coach.v3',JSON.stringify({disabled:true}));
   localStorage.setItem('lantern-story-seen',JSON.stringify(['opening','ch1-intro','ch1-boss','ch1-clear','ch2-intro','ch2-boss','ch2-clear','ch3-intro','ch3-boss','ending']));
  });
  await use(page);
 },
});
