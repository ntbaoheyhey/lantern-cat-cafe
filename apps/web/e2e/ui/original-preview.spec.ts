import { expect, test, type Page } from '../support/test';
import { mockV2Save } from '../../src/api/mockV2Fixtures';
import fs from 'node:fs';
import path from 'node:path';
import { expectArtPaint } from '../support/art-ready';
const storageKey=fs.readFileSync('src/api/MockGameApiV2.ts','utf8').match(/export const MOCK_V2_STORAGE_KEY = '([^']+)'/)![1]!;
async function prepare(page: Page) {
  const save=mockV2Save('bossReadyStrong',{nowMs:Date.now(),classId:'warrior'});
  await page.addInitScript(({key,save})=>{localStorage.setItem(key,save);localStorage.setItem('taskbar-hero.howToPlaySeen','1');},{key:storageKey,save:JSON.stringify(save)});
}
async function geometry(page: Page) {
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth||document.documentElement.scrollHeight>innerHeight)).toBe(false);
  await expect(page.getByRole('switch',{name:'Catalog preview'})).toBeInViewport({ratio:1});
  const bad=await page.locator('.original-preview select:visible,.original-preview-header button:visible,.original-sections button:visible').evaluateAll(nodes=>nodes.filter(node=>{const b=node.getBoundingClientRect();return b.left<0||b.top<0||b.right>innerWidth+1||b.bottom>innerHeight+1;}).map(node=>node.textContent));expect(bad).toEqual([]);
  const art=await page.locator('[data-original-art]').evaluateAll(nodes=>nodes.map(node=>{const b=node.getBoundingClientRect();return {width:b.width,height:b.height,rendering:getComputedStyle(node).imageRendering};}));
  expect(art.length).toBeGreaterThan(0);expect(art.every(item=>[32,64,96].includes(item.width)&&item.height===item.width&&item.rendering==='pixelated')).toBe(true);
  await expect(page.locator('[data-art-missing]')).toHaveCount(0);
}
async function capture(page: Page,name: string) {
  if(await page.locator('[data-original-art]').count()) await expectArtPaint(page);
  if(!process.env.ORIGINAL_SCREENSHOTS)return;
  const dir=path.resolve(process.env.ORIGINAL_SCREENSHOTS);fs.mkdirSync(dir,{recursive:true});await page.screenshot({path:path.join(dir,name+'.png')});
}
for(const size of [{width:1280,height:720},{width:1600,height:900}]) for(const motion of ['no-preference','reduce'] as const){
  test(`ORIG2 local catalog and original art ${size.width} ${motion}`,async({page})=>{
    await page.setViewportSize(size);await page.emulateMedia({reducedMotion:motion});await prepare(page);
    const errors:string[]=[],writes:string[]=[];
    page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
    page.on('request',request=>{if(!['GET','HEAD','OPTIONS'].includes(request.method()))writes.push(request.method());});
    await page.goto('/');await page.getByRole('tab',{name:'Help',exact:true}).click();await page.getByRole('tab',{name:'Catalog preview',exact:true}).click();
    const toggle=page.getByRole('switch',{name:'Catalog preview'});await expect(toggle).toHaveAttribute('aria-checked','false');await expect(page.locator('[data-original-art]')).toHaveCount(0);await capture(page,`off-${size.width}-${motion}`);
    await toggle.focus();await page.keyboard.press('Space');await expect(toggle).toHaveAttribute('aria-checked','true');
    const items=page.getByRole('list',{name:'Preview items'});await expect(items.getByRole('button')).toHaveCount(15);
    await page.evaluate(()=>document.fonts.ready);
    const atlas=await page.locator('[data-original-art]').first().evaluate(async node=>{const url=getComputedStyle(node).backgroundImage.slice(5,-2);const image=new Image();image.src=url;await image.decode();return {width:image.naturalWidth,height:image.naturalHeight};});expect(atlas).toEqual({width:272,height:170});
    await expectArtPaint(page);await capture(page,`items-common-${size.width}-${motion}`);
    await page.getByLabel('Preview quality',{exact:true}).selectOption('rare');await page.getByLabel('Preview item level',{exact:true}).selectOption('6');
    await expect(page.getByTestId('draft-bonus-atk')).toHaveText('+13.566');await expect(page.getByTestId('draft-upgrade-cost')).toHaveText('Maximum preview level');await geometry(page);await capture(page,`items-${size.width}-${motion}`);
    await page.getByRole('group',{name:'Item categories'}).getByRole('button',{name:'Accessories',exact:true}).click();await expect(items.getByRole('button')).toHaveCount(4);
    await items.getByRole('button',{name:/Purrwell Token/}).focus();await page.keyboard.press('Enter');await page.getByLabel('Preview quality',{exact:true}).selectOption('common');await page.getByLabel('Preview item level',{exact:true}).selectOption('1');await expect(page.getByTestId('draft-bonus-hpRegen')).toHaveText('+0.15%/s');
    const sections=page.getByRole('group',{name:'Catalog sections'});await sections.getByRole('button',{name:'Stats',exact:true}).click();await expect(page.getByRole('table',{name:'Draft stat definitions'}).getByRole('row')).toHaveCount(13);await geometry(page);await capture(page,`stats-${size.width}-${motion}`);
    const scroll=page.getByLabel('Scrollable draft stats');await scroll.focus();await page.keyboard.press('End');
    if(size.height===720)await expect.poll(()=>scroll.evaluate(node=>node.scrollTop)).toBeGreaterThan(0);
    await page.keyboard.press('Home');await expect.poll(()=>scroll.evaluate(node=>node.scrollTop)).toBe(0);
    await sections.getByRole('button',{name:'Skills',exact:true}).click();const skills=page.getByRole('list',{name:'Preview skills'});await expect(skills.getByRole('button')).toHaveCount(7);
    await skills.getByRole('button',{name:/Hemskip Pair/}).click();await page.getByLabel('Preview skill rank',{exact:true}).selectOption('3');await expect(page.getByTestId('draft-skill-output')).toHaveText('19.68');await geometry(page);await capture(page,`skills-${size.width}-${motion}`);
    await toggle.click();await expect(toggle).toHaveAttribute('aria-checked','false');await expect(page.locator('[data-original-art]')).toHaveCount(0);
    await toggle.click();await page.getByRole('tab',{name:'Guide',exact:true}).click();await page.getByRole('tab',{name:'Catalog preview',exact:true}).click();await expect(toggle).toHaveAttribute('aria-checked','false');
    await page.reload();await page.getByRole('tab',{name:'Help',exact:true}).click();await page.getByRole('tab',{name:'Catalog preview',exact:true}).click();await expect(toggle).toHaveAttribute('aria-checked','false');
    expect(writes).toEqual([]);expect(errors).toEqual([]);
  });
}
