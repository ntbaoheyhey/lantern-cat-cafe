// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { BANNERS, CARDS, emptyPity } from '@taskbar-hero/game-rules/cardrpg';
import { GEAR_BY_ID } from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import { DepthModel } from './model';
import { Invitations } from './Invitations';

vi.mock('./CompanionPreview', () => ({ CompanionPreview: ({ id, entranceKey }: { id: string; entranceKey?: string }) =>
  <div data-testid="invitation-miniature" data-entrance={entranceKey}>Model preview {id}</div> }));
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });

function paidAccount() {
  const model = new DepthModel(true);
  model.state.freeInvite = true;
  model.state.account.currencies.stamps = 3000;
  return model;
}

it('opens the earned welcome once, and skip changes only the presentation', () => {
  const model = new DepthModel(true);
  const stamps = model.state.account.currencies.stamps;
  render(<Invitations m={model} />);
  fireEvent.click(screen.getByRole('button', { name: 'Open free welcome invitation' }));
  expect(model.state.freeInvite).toBe(true);
  expect(model.state.account.currencies.stamps).toBe(stamps);
  expect(model.state.account.history).toHaveLength(1);
  expect(screen.getByLabelText('Sealed invitation')).toBeTruthy();
  const committed = structuredClone(model.state);
  fireEvent.click(screen.getByRole('button', { name: 'Skip reveal' }));
  expect(model.state).toEqual(committed);
  expect(screen.getByRole('region', { name: 'Invitation results' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Open free welcome invitation' })).toBeNull();
});

it('commits a ten-pull exactly once and keeps all results after navigation', () => {
  const model = paidAccount();
  const view = render(<Invitations m={model} />);
  fireEvent.click(screen.getByRole('button', { name: 'Invite ten · 1500 stamps' }));
  expect(model.state.account.currencies.stamps).toBe(1500);
  expect(model.state.account.history).toHaveLength(10);
  expect((screen.getByRole('button', { name: 'Invite once · 150 stamps' }) as HTMLButtonElement).disabled).toBe(true);
  const committed = structuredClone(model.state);
  view.unmount();
  render(<Invitations m={model} />);
  expect(model.state).toEqual(committed);
  expect(screen.getByText('10 recorded results · Latest first · Each banner keeps its own pity')).toBeTruthy();
  expect(model.state.account.history.every(result => result.soulbound && !result.tradeable)).toBe(true);
});

it('moves through anticipation, rarity hint and card reveal before the complete batch', () => {
  vi.useFakeTimers();
  const model = paidAccount();
  render(<Invitations m={model} />);
  fireEvent.click(screen.getByRole('button', { name: 'Invite once · 150 stamps' }));
  act(() => vi.advanceTimersByTime(550));
  expect(screen.getByLabelText(`${model.state.account.history[0]!.rarity} invitation`)).toBeTruthy();
  act(() => vi.advanceTimersByTime(500));
  expect(screen.getByRole('button', { name: 'View results' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'View results' }));
  expect(screen.getByRole('region', { name: 'Invitation results' })).toBeTruthy();
  expect(model.state.account.daily.draws).toBe(1);
});

it('shows actual conditional hard pity and the featured guarantee', () => {
  const model = paidAccount();
  model.state.account.pity['cats-featured'] = { ...emptyPity(), sinceLegendary: 59, featuredGuaranteed: true };
  render(<Invitations m={model} />);
  fireEvent.click(screen.getByRole('button', { name: 'Marigold at Closing Time' }));
  expect(screen.getByText('Legendary guaranteed in 1')).toBeTruthy();
  expect(screen.getByText('Your next legendary is Marigold.')).toBeTruthy();
  expect(screen.getByText('100.00%')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Invite once · 150 stamps' }));
  expect(model.state.account.history[0]).toMatchObject({ cardId: 'marigold', rarity: 'legendary', pityBefore: 59 });
  expect(screen.getByText('Legendary guaranteed in 60')).toBeTruthy();
});

it('exposes soft-pity odds from the existing banner rules', () => {
  const model = paidAccount();
  model.state.account.pity['cats-standard'] = { ...emptyPity(), sinceLegendary: 40 };
  render(<Invitations m={model} />);
  expect(screen.getByText('4.00%')).toBeTruthy();
  expect(screen.getByText('Legendary guaranteed in 20')).toBeTruthy();
});

it('shows duplicate shard conversion and skips all ceremony for reduced motion', () => {
  const model = paidAccount();
  model.state.settings.reducedMotion = true;
  model.state.account.cards = CARDS.map(card => ({ id: card.id, cardId: card.id, level: 1, stars: 1, shards: 0, soulbound: true }));
  render(<Invitations m={model} />);
  fireEvent.click(screen.getByRole('button', { name: 'Invite once · 150 stamps' }));
  const result = model.state.account.history[0]!;
  expect(result.duplicate).toBe(true);
  expect(screen.queryByRole('button', { name: 'Skip reveal' })).toBeNull();
  const summary = within(screen.getByRole('region', { name: 'Invitation results' }));
  expect(summary.getByText(`Duplicate → ${result.shards} shards`)).toBeTruthy();
  expect(model.state.account.cards.find(card => card.cardId === result.cardId)!.shards).toBe(result.shards);
});

it('respects system reduced motion and cancels pending ceremony timers on unmount', () => {
  vi.useFakeTimers();
  const remove = vi.fn();
  vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: remove }));
  const model = paidAccount();
  const view = render(<Invitations m={model} />);
  fireEvent.click(screen.getByRole('button', { name: 'Invite once · 150 stamps' }));
  expect(screen.queryByLabelText('Sealed invitation')).toBeNull();
  view.unmount();
  expect(remove).toHaveBeenCalledTimes(1);
});

it('uses the equipment banner command and receives an actual bound depth item', () => {
  const model = paidAccount();
  model.state.settings.reducedMotion = true;
  const gearCount = model.state.gear.length;
  render(<Invitations m={model} />);
  fireEvent.click(screen.getByRole('button', { name: 'Mending Basket' }));
  fireEvent.click(screen.getByRole('button', { name: 'Invite once · 150 stamps' }));
  expect(model.state.gear).toHaveLength(gearCount + 1);
  expect(model.state.account.history[0]).toMatchObject({ bannerId: 'equipment', soulbound: true, tradeable: false });
  expect(model.state.account.history[0]!.itemId).toBeTruthy();
});

it('shows the same legendary equipment name as the inventory', () => {
  const model = paidAccount();
  model.state.settings.reducedMotion = true;
  model.state.account.pity.gear = { ...emptyPity(), sinceLegendary: 59 };
  render(<Invitations m={model} />);
  fireEvent.click(screen.getByRole('button', { name: 'Mending Basket' }));
  expect(screen.queryByText('Model preview clover')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Invite once · 150 stamps' }));
  const item = model.state.gear.at(-1)!;
  const summary = within(screen.getByRole('region', { name: 'Invitation results' }));
  expect(summary.getByText(GEAR_BY_ID[item.templateId]!.name)).toBeTruthy();
});

it('retains the featured miniature while the card ceremony hides it', () => {
  const model = paidAccount();
  render(<Invitations m={model} />);
  const miniature = screen.getByText('Model preview clover');
  fireEvent.click(screen.getByRole('button', { name: 'Invite once · 150 stamps' }));
  expect(screen.getByText('Model preview clover')).toBe(miniature);
  expect(miniature.closest('[hidden]')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Skip reveal' }));
  expect(screen.getByText('Model preview clover')).toBe(miniature);
  expect(miniature.closest('[hidden]')).toBeNull();
});

it('reuses the miniature for a legendary entrance, then restores the banner preview', () => {
  vi.useFakeTimers();
  const model = paidAccount();
  model.state.account.pity['cats-featured'] = { ...emptyPity(), sinceLegendary: 59, featuredGuaranteed: true };
  render(<Invitations m={model} />);
  fireEvent.click(screen.getByRole('button', { name: 'Marigold at Closing Time' }));
  const miniature = screen.getByTestId('invitation-miniature');
  fireEvent.click(screen.getByRole('button', { name: 'Invite once · 150 stamps' }));
  expect(miniature.closest('[hidden]')).toBeTruthy();
  act(() => vi.advanceTimersByTime(550));
  act(() => vi.advanceTimersByTime(500));
  expect(screen.getByTestId('invitation-miniature')).toBe(miniature);
  expect(miniature.getAttribute('data-entrance')).toBe(`featured-${model.state.account.history[0]!.index}`);
  expect(miniature.closest('[hidden]')).toBeNull();
  const committed = structuredClone(model.state);
  fireEvent.click(screen.getByRole('button', { name: 'Skip reveal' }));
  expect(screen.getByTestId('invitation-miniature')).toBe(miniature);
  expect(miniature.getAttribute('data-entrance')).toBeNull();
  expect(model.state).toEqual(committed);
});

it('keeps published odds, earned cost, pity and the latest result together', () => {
  const model = paidAccount();
  model.state.settings.reducedMotion = true;
  render(<Invitations m={model} />);
  const fairness = within(screen.getByRole('region', { name: 'Invitation fairness' }));
  expect(fairness.getByText('Base odds')).toBeTruthy();
  expect(fairness.getByText(`legendary ${BANNERS[0]!.oddsBp.legendary / 100}%`)).toBeTruthy();
  expect(fairness.getByText(/150 stamps each.*Earn stamps from cafe service/)).toBeTruthy();
  expect(fairness.getByText('Legendary guaranteed in 60')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Invite once · 150 stamps' }));
  expect(fairness.getByRole('link').getAttribute('href')).toBe('#invitation-history');
  expect(fairness.getByRole('link').textContent).toContain('Latest');
  expect(fairness.getByRole('link').textContent).toContain('View history (1)');
  expect(screen.getByTestId('invitation-miniature').getAttribute('data-entrance')).toBeNull();
});

it.each(['funds', 'daily-cap', 'active-route'])('disables invitations at the %s boundary', boundary => {
  const model = paidAccount();
  if (boundary === 'funds') model.state.account.currencies.stamps = 149;
  if (boundary === 'daily-cap') model.state.account.daily.draws = 30;
  if (boundary === 'active-route') model.start(1);
  const before = structuredClone(model.state);
  render(<Invitations m={model} />);
  const once = screen.getByRole('button', { name: 'Invite once · 150 stamps' }) as HTMLButtonElement;
  const ten = screen.getByRole('button', { name: 'Invite ten · 1500 stamps' }) as HTMLButtonElement;
  expect(once.disabled).toBe(true);
  expect(ten.disabled).toBe(true);
  fireEvent.click(once);
  expect(model.state).toEqual(before);
});


it('brings the ceremony below the visible fairness summary once per pull', () => {
  vi.useFakeTimers();
  const model = paidAccount();
  render(<Invitations m={model} />);
  const fairness = screen.getByRole('region', { name: 'Invitation fairness' });
  const stage = screen.getByRole('region', { name: 'Invitation reveal' });
  Object.defineProperty(fairness, 'offsetHeight', { value: 130 });
  const scroll = vi.fn();
  stage.scrollIntoView = scroll;
  fireEvent.click(screen.getByRole('button', { name: 'Invite once · 150 stamps' }));
  expect(stage.style.scrollMarginTop).toBe('142px');
  expect(scroll).toHaveBeenCalledWith({ block: 'start', behavior: 'instant' });
  act(() => vi.advanceTimersByTime(550));
  act(() => vi.advanceTimersByTime(500));
  expect(scroll).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole('button', { name: 'Skip reveal' }));
  expect(scroll).toHaveBeenCalledTimes(1);
});
