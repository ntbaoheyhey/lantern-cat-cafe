import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import { DepthModel } from './model';
import { HomeV4 } from './HomeV4';

vi.mock('./CompanionPreview', () => ({ CompanionPreview: () => null }));
afterEach(cleanup);
const model = () => {
 const m = new DepthModel(true, true);
 m.state = R.setGameplayV4(R.createDepthAccount(11), true);
 return m;
};
const ready = () => { const m = model(); m.state.tutorial = 4; m.state.freeInvite = true; return m; };
const home = () => within(screen.getByRole('region', { name: 'Tonight at home' }));

it('advances the primary opening action as lessons, invitation and equipment finish', () => {
 const m = model(), ui = render(<HomeV4 m={m} />);
 fireEvent.click(home().getByRole('button', { name: 'Try the practice table →' }));
 expect(m.screen).toBe('prepare'); expect(m.tutorialBattle).toBe(true);
 m.state.tutorial = 3; m.go('hub'); ui.rerender(<HomeV4 m={m} />);
 expect(home().queryByText(/Try the practice table\./)).toBeNull();
 fireEvent.click(home().getByRole('button', { name: 'Open your welcome invitation →' }));
 expect(m.screen).toBe('gacha');
 m.invite(true); m.go('hub'); ui.rerender(<HomeV4 m={m} />);
 fireEvent.click(home().getByRole('button', { name: 'Equip your first piece →' }));
 expect(m.screen).toBe('inventory');
});

it('starts the available chapter at the selected band without spending currency', () => {
 const m = ready(); for (const cat of m.state.account.cards) cat.level = 5;
 const money = { ...m.state.account.currencies };
 render(<HomeV4 m={m} />);
 expect(home().queryByText(/Try the practice table/)).toBeNull();
 fireEvent.change(screen.getByRole('combobox', { name: 'Challenge band' }), { target: { value: '2' } });
 fireEvent.click(home().getByRole('button', { name: 'Explore Tangled Cafe →' }));
 expect(m.screen).toBe('map'); expect(m.state.run?.chapter).toBe(1);
 expect(m.state.run?.challengeLevel).toBe(2); expect(m.state.account.currencies).toEqual(money);
});

it('opens the next unlocked chapter and never replaces an active route', () => {
 const m = ready(); m.state.cleared = [1];
 const ui = render(<HomeV4 m={m} />);
 fireEvent.click(home().getByRole('button', { name: 'Explore Rooftop Orchard →' }));
 expect(m.state.run?.chapter).toBe(2);
 m.go('hub'); const before = R.exportSave(m.state); ui.rerender(<HomeV4 m={m} />);
 fireEvent.click(home().getByRole('button', { name: 'Continue your route →' }));
 expect(m.screen).toBe('map'); expect(R.exportSave(m.state)).toBe(before);
});

it('offers a familiar route after all chapters and a new stop after all recorded stars', () => {
 const m = ready(); m.state.cleared = [1, 2, 3];
 R.recordNodeStarsV4(m.state, { key: '1/1/0-0/battle', chapter: 1, band: 1, nodeId: '0-0', kind: 'battle', conditions: [true, true, true] });
 const ui = render(<HomeV4 m={m} />);
 expect(home().getByText('Explore another stop for a new star.')).toBeTruthy();
 expect(home().queryByText('Win your first route encounter.')).toBeNull();
 m.state.v4!.journey!.stars['1/1/0-0/battle']!.conditions = [true, false, true];
 ui.rerender(<HomeV4 m={m} />);
 expect(home().getByText('Tangled Cafe, stop 1: Win without a cat falling.')).toBeTruthy();
 fireEvent.click(home().getByRole('button', { name: 'Revisit Midnight Pantry →' }));
 expect(m.state.run?.chapter).toBe(3);
});
