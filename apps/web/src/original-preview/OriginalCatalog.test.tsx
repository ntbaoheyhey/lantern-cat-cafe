// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { CONFIG } from '@taskbar-hero/game-rules';
import OriginalCatalog, { formatDraftStat } from './OriginalCatalog';
import { Tabs } from '../ui';
import { OriginalArt } from './OriginalArt';
import atlas from '../art/generated/original/atlas/atlas.json';
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
const enable = () => fireEvent.click(screen.getByRole('switch', { name: 'Catalog preview' }));
const section = (name: string) => fireEvent.click(within(screen.getByRole('group', { name: 'Catalog sections' })).getByRole('button', { name }));

it('starts OFF, exposes no content/art and never mutates shared config, storage or network', () => {
  const before = JSON.stringify(CONFIG);
  const store = vi.spyOn(Storage.prototype, 'setItem');
  const fetch = vi.spyOn(globalThis, 'fetch');
  const { container } = render(<OriginalCatalog />);
  expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe('false');
  expect(screen.queryByText('Seamlight Saber')).toBeNull(); expect(container.querySelectorAll('[data-original-art]')).toHaveLength(0);
  enable(); expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe('true');
  fireEvent.change(screen.getByLabelText('Preview quality'), { target: { value: 'rare' } });
  fireEvent.change(screen.getByLabelText('Preview item level'), { target: { value: '6' } });
  expect(screen.getByTestId('draft-bonus-atk').textContent).toBe('+13.566');
  expect(screen.getByTestId('draft-upgrade-cost').textContent).toBe('Maximum preview level');
  section('Skills'); fireEvent.change(screen.getByLabelText('Preview skill rank'), { target: { value: '3' } });
  enable(); expect(screen.queryByRole('list', { name: 'Preview skills' })).toBeNull();
  expect(CONFIG.features.originalEconomy).toBe(false); expect(JSON.stringify(CONFIG)).toBe(before);
  expect(store).not.toHaveBeenCalled(); expect(fetch).not.toHaveBeenCalled();
});
it('covers all15 item examples, filters by actual slots and keeps fractional accessories visible', () => {
  render(<OriginalCatalog />); enable();
  const list = screen.getByRole('list', { name: 'Preview items' }); expect(within(list).getAllByRole('button')).toHaveLength(15);
  const filters = within(screen.getByRole('group', { name: 'Item categories' }));
  fireEvent.click(filters.getByRole('button', { name: 'Weapons' })); expect(within(list).getAllByRole('button')).toHaveLength(7);
  fireEvent.click(filters.getByRole('button', { name: 'Armor' })); expect(within(list).getAllByRole('button')).toHaveLength(4);
  fireEvent.click(filters.getByRole('button', { name: 'Accessories' })); expect(within(list).getAllByRole('button')).toHaveLength(4);
  fireEvent.click(within(list).getByRole('button', { name: /Purrwell Token/ }));
  expect(screen.getByTestId('draft-bonus-hpRegen').textContent).toBe('+0.15%/s');
  expect(screen.getByTestId('draft-upgrade-cost').textContent).toBe('Next draft upgrade: 18 Fish');
});
it('shows all12 stat definitions with unit-aware bases and caps', () => {
  render(<OriginalCatalog />); enable(); section('Stats');
  const table = within(screen.getByRole('table', { name: 'Draft stat definitions' })); expect(table.getAllByRole('row')).toHaveLength(13);
  expect(screen.getByTestId('draft-stat-critChance').textContent).toContain('3.5%42%');
  expect(screen.getByTestId('draft-stat-hpRegen').textContent).toContain('0%/s1.2%/s');
  expect(formatDraftStat('hp', 116)).toBe('116'); expect(formatDraftStat('hpRegen', 0.0015)).toBe('0.15%/s');
});
it('shows7 skills, all ranks, correct trigger units and complete per-trigger output', () => {
  render(<OriginalCatalog />); enable(); section('Skills'); const list=screen.getByRole('list', { name: 'Preview skills' });
  expect(within(list).getAllByRole('button')).toHaveLength(7);
  fireEvent.click(within(list).getByRole('button', { name: /Hemskip Pair/ }));
  fireEvent.change(screen.getByLabelText('Preview skill rank'), { target: { value: '3' } });
  expect(screen.getByTestId('draft-skill-output').textContent).toBe('19.68'); expect(screen.getByText('Every 9 basic attacks')).toBeTruthy();
  expect(screen.getByText('126 Fish · requires level 9')).toBeTruthy();
  fireEvent.click(within(list).getByRole('button', { name: /Mossfoam Parcel/ })); expect(screen.getByTestId('draft-skill-output').textContent).toBe('12.76');
  expect(screen.getByText('Every 15 seconds')).toBeTruthy();
});
it('ignores unknown select values and returns OFF after lazy Help tab unmount', () => {
  render(<Tabs label="Help sections" tabs={[{id:'catalog',label:'Catalog',lazy:true,content:<OriginalCatalog />},{id:'guide',label:'Guide',content:<p>Guide</p>}]} />);
  enable(); const quality=screen.getByLabelText('Preview quality') as HTMLSelectElement;
  fireEvent.change(quality,{target:{value:'__proto__'}}); expect(quality.value).toBe('common');
  const level=screen.getByLabelText('Preview item level') as HTMLSelectElement; fireEvent.change(level,{target:{value:'999'}}); expect(level.value).toBe('1');
  fireEvent.click(screen.getByRole('tab',{name:'Guide'})); fireEvent.click(screen.getByRole('tab',{name:'Catalog'}));
  expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe('false');
});
it('uses safe static atlas lookups and integer scales, with an explicit missing-art fallback', () => {
  const {container}=render(<><OriginalArt kind="item" id="seamblade" scale={2}/><OriginalArt kind="item" id="../../bad"/></>);
  const icon=container.querySelector<HTMLElement>('[data-original-art]')!;expect(icon.style.width).toBe('64px');expect(icon.style.height).toBe('64px');
  expect(icon.getAttribute('aria-hidden')).toBe('true');
  const frame=atlas.frames['item-seamblade'].frame;expect(icon.style.backgroundPosition).toBe(`${-frame.x*2}px ${-frame.y*2}px`);
  expect(icon.style.backgroundSize).toBe(`${atlas.meta.size.w*2}px ${atlas.meta.size.h*2}px`);expect(container.querySelector('[data-art-missing]')).toBeTruthy();
});


it('has exact native art coverage for all original table IDs without inventing extra content', () => {
  const expected = [
    ...Object.keys(CONFIG.originalEconomy.stats).map(id => `stat-${id.toLowerCase()}`),
    ...Object.keys(CONFIG.originalEconomy.gear.items).map(id => `item-${id}`),
    ...Object.keys(CONFIG.originalEconomy.skills.entries).map(id => `skill-${id}`),
  ];
  expect(Object.keys(atlas.frames).sort()).toEqual(expected.sort());
  expect(atlas.meta.frameOrder).toEqual([...expected].sort());
  for (const frame of Object.values(atlas.frames)) expect(frame.sourceSize).toEqual({ w: 32, h: 32 });
});
