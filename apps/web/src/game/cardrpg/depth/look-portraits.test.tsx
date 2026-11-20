import { useSyncExternalStore } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { isLookV2, setLookV2, subscribeLookV2 } from '../../squad/turn3d/look-v2';
import { selectPortrait, type LookPortraitManifest } from './look-portraits';
import { DepthModel } from './model';
import { CompanionCard } from './CompanionCard';

const manifest: LookPortraitManifest = { version: 2, pathBase: 'repository-root', portraits: {
  mochi: { portrait: { '1x': 'assets/cardrpg-look/portraits/mochi-1x.webp', '2x': 'assets/cardrpg-look/portraits/mochi-2x.webp' } },
} };
const sources = { 'assets/cardrpg-look/portraits/mochi-1x.webp': 'blob:mochi-one',
  'assets/cardrpg-look/portraits/mochi-2x.webp': 'blob:mochi-two' };

vi.mock('./assets', () => ({ portraitProps: (id: string) =>
  selectPortrait(id, isLookV2(), `/classic/${id}.webp`, manifest, sources) }));
afterEach(() => { cleanup(); setLookV2(false); });

it('selects a complete density pair without putting repository paths into image URLs', () => {
  expect(selectPortrait('mochi', true, '/classic.webp', manifest, sources))
    .toEqual({ src: 'blob:mochi-one', srcSet: 'blob:mochi-one 1x, blob:mochi-two 2x' });
});

it('keeps classic images with no stale density source when LOOK is off, absent or incomplete', () => {
  const classic = { src: '/classic.webp', srcSet: undefined };
  expect(selectPortrait('mochi', false, classic.src, manifest, sources)).toEqual(classic);
  expect(selectPortrait('mochi', true, classic.src, undefined, sources)).toEqual(classic);
  expect(selectPortrait('marigold', true, classic.src, manifest, sources)).toEqual(classic);
  expect(selectPortrait('mochi', true, classic.src, manifest, { ...sources, 'assets/cardrpg-look/portraits/mochi-2x.webp': '' })).toEqual(classic);
  expect(selectPortrait('mochi', true, classic.src, { ...manifest, version: 3 }, sources)).toEqual(classic);
});

it('updates the actual card on live LOOK changes and removes srcset on return without changing the account', () => {
  const model = new DepthModel(true), selected = vi.fn();
  const before = structuredClone(model.state);
  function Cards() {
    useSyncExternalStore(subscribeLookV2, isLookV2, () => false);
    return <><CompanionCard id="mochi" m={model} onSelect={selected} />
      <CompanionCard id="marigold" m={model} /></>;
  }
  const view = render(<Cards />);
  const [mochi, marigold] = view.container.querySelectorAll('.cr-portrait > img');
  expect(mochi!.getAttribute('src')).toBe('/classic/mochi.webp');
  expect(mochi!.hasAttribute('srcset')).toBe(false);
  act(() => setLookV2(true));
  expect(mochi!.getAttribute('src')).toBe('blob:mochi-one');
  expect(mochi!.getAttribute('srcset')).toBe('blob:mochi-one 1x, blob:mochi-two 2x');
  expect(marigold!.getAttribute('src')).toBe('/classic/marigold.webp');
  expect(marigold!.hasAttribute('srcset')).toBe(false);
  fireEvent.click(view.getByRole('button', { name: /^Mochi,/ }));
  expect(selected).toHaveBeenCalledOnce();
  act(() => setLookV2(false));
  expect(mochi!.getAttribute('src')).toBe('/classic/mochi.webp');
  expect(mochi!.hasAttribute('srcset')).toBe(false);
  expect(model.state).toEqual(before);
});
