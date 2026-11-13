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
 fireEvent.click(home().getByRole('button', { name: 'Try the practice table' }));
 expect(m.screen).toBe('prepare'); expect(m.tutorialBattle).toBeTruthy();
 m.state.tutorial = 3; m.go('hub'); ui.rerender(<HomeV4 m={m} />);
 expect(home().queryByText(/Try the practice table\./)).toBeNull();
 fireEvent.click(home().getByRole('button', { name: 'Open your welcome invitation' }));
 expect(m.screen).toBe('gacha');
 m.invite(true); m.go('hub'); ui.rerender(<HomeV4 m={m} />);
 fireEvent.click(home().getByRole('button', { name: 'Equip your first piece' }));
 expect(m.screen).toBe('inventory');
});

it('starts the available chapter at the selected band without spending currency', () => {
 const m = ready(); for (const cat of m.state.account.cards) cat.level = 5;
 const money = { ...m.state.account.currencies };
 render(<HomeV4 m={m} />);
 expect(home().queryByText(/Try the practice table/)).toBeNull();
 fireEvent.change(screen.getByRole('combobox', { name: 'Challenge band' }), { target: { value: '2' } });
 fireEvent.click(home().getByRole('button', { name: 'Explore Tangled Cafe' }));
 expect(m.screen).toBe('map'); expect(m.state.run?.chapter).toBe(1);
 expect(m.state.run?.challengeLevel).toBe(2); expect(m.state.account.currencies).toEqual(money);
});

it('opens the next unlocked chapter and never replaces an active route', () => {
 const m = ready(); m.state.cleared = [1];
 const ui = render(<HomeV4 m={m} />);
 fireEvent.click(home().getByRole('button', { name: 'Explore Rooftop Orchard' }));
 expect(m.state.run?.chapter).toBe(2);
 m.go('hub'); const before = R.exportSave(m.state); ui.rerender(<HomeV4 m={m} />);
 fireEvent.click(home().getByRole('button', { name: 'Continue your route' }));
 expect(m.screen).toBe('map'); expect(R.exportSave(m.state)).toBe(before);
});

it('revisits the chapter named by the next star after clearing all chapters', () => {
 const m = ready(); m.state.cleared = [1, 2, 3];
 R.recordNodeStarsV4(m.state, { key: '1/1/0-0/battle', chapter: 1, band: 1, nodeId: '0-0', kind: 'battle', conditions: [true, true, true] });
 const ui = render(<HomeV4 m={m} />);
 expect(home().getByText('Explore Midnight Pantry for a new star.')).toBeTruthy();
 expect(home().queryByText('Win your first route encounter.')).toBeNull();
 m.state.v4!.journey!.stars['1/1/0-0/battle']!.conditions = [true, false, true];
 ui.rerender(<HomeV4 m={m} />);
 expect(home().getByText('Tangled Cafe · band 1, stop 1: Win without a cat falling.')).toBeTruthy();
 fireEvent.click(home().getByRole('button', { name: 'Revisit Tangled Cafe' }));
 expect(m.state.run?.chapter).toBe(1); expect(m.state.run?.challengeLevel).toBe(1);
});


it('keeps each star hint and primary destination on the explicitly selected band', () => {
 const m = ready(); m.state.cleared = [1, 2, 3];
 for (const cat of m.state.account.cards) cat.level = 5;
 R.recordNodeStarsV4(m.state, { key: '1/2/0-0/battle', chapter: 1, band: 2, nodeId: '0-0', kind: 'battle', conditions: [true, false, true] });
 R.recordNodeStarsV4(m.state, { key: '2/4/6-0/boss', chapter: 2, band: 4, nodeId: '6-0', kind: 'boss', conditions: [true, true, false] });
 const money = { ...m.state.account.currencies };
 render(<HomeV4 m={m} />);
 expect((screen.getByRole('combobox', { name: 'Challenge band' }) as HTMLSelectElement).value).toBe('2');
 expect(home().getByText('Tangled Cafe · band 2, stop 1: Win without a cat falling.')).toBeTruthy();
 fireEvent.change(screen.getByRole('combobox', { name: 'Challenge band' }), { target: { value: '4' } });
 expect(home().getByText('Rooftop Orchard · band 4, stop 7: Win within 10 rounds.')).toBeTruthy();
 expect(home().queryByText(/Tangled Cafe · band/)).toBeNull();
 fireEvent.click(home().getByRole('button', { name: 'Revisit Rooftop Orchard' }));
 expect(m.state.run?.chapter).toBe(2); expect(m.state.run?.challengeLevel).toBe(4);
 expect(m.state.account.currencies).toEqual(money);
});

it('prioritizes an uncleared chapter and only shows a star from that destination', () => {
 const m = ready(); m.state.cleared = [1];
 R.recordNodeStarsV4(m.state, { key: '1/1/0-0/battle', chapter: 1, band: 1, nodeId: '0-0', kind: 'battle', conditions: [true, false, true] });
 render(<HomeV4 m={m} />);
 expect(home().getByText('Explore Rooftop Orchard for a new star.')).toBeTruthy();
 expect(home().queryByText(/Tangled Cafe · band/)).toBeNull();
 fireEvent.click(home().getByRole('button', { name: 'Explore Rooftop Orchard' }));
 expect(m.state.run?.chapter).toBe(2);
});

it('ignores stars above the current crew ceiling and keeps the active route band', () => {
 const m = ready(); m.state.cleared = [1, 2, 3];
 R.recordNodeStarsV4(m.state, { key: '1/5/0-0/battle', chapter: 1, band: 5, nodeId: '0-0', kind: 'battle', conditions: [true, false, true] });
 const ui = render(<HomeV4 m={m} />);
 expect(home().queryByText(/Tangled Cafe · band/)).toBeNull();
 expect(home().getByRole('button', { name: 'Revisit Midnight Pantry' })).toBeTruthy();
 for (const cat of m.state.account.cards) cat.level = 5;
 m.start(2, 'campaign', 2); m.go('hub');
 const before = R.exportSave(m.state); ui.rerender(<HomeV4 m={m} />);
 expect((screen.getByRole('combobox', { name: 'Challenge band' }) as HTMLSelectElement).value).toBe('2');
 expect((screen.getByRole('combobox', { name: 'Challenge band' }) as HTMLSelectElement).disabled).toBe(true);
 fireEvent.click(home().getByRole('button', { name: 'Continue your route' }));
 expect(m.screen).toBe('map'); expect(R.exportSave(m.state)).toBe(before);
});


it('starts an uncleared chapter at band one even when the crew has grown', () => {
 const m=ready();for(const c of m.state.account.cards)c.level=5;
 const before=R.exportSave(m.state);render(<HomeV4 m={m}/>);
 expect((screen.getByRole('combobox',{name:'Challenge band'}) as HTMLSelectElement).value).toBe('1');
 expect(home().getByText('Band 1 stays fixed as your crew grows. Choose a higher band below when ready.')).toBeTruthy();
 expect(R.exportSave(m.state)).toBe(before);
 fireEvent.click(home().getByRole('button',{name:'Explore Tangled Cafe'}));
 expect(m.state.run!.challengeLevel).toBe(1);
});
it('keeps a previously chosen band after loss, growth and a new Home visit', () => {
 const m=ready();for(const c of m.state.account.cards)c.level=2;
 m.start(1,'campaign',2);m.state=R.abandonRun(m.state).state;
 for(const c of m.state.account.cards)c.level=5;m.go('hub');
 const before=R.exportSave(m.state);render(<HomeV4 m={m}/>);
 expect((screen.getByRole('combobox',{name:'Challenge band'}) as HTMLSelectElement).value).toBe('2');
 expect(R.exportSave(m.state)).toBe(before);
 fireEvent.click(home().getByRole('button',{name:'Explore Tangled Cafe'}));
 expect(m.state.run!.challengeLevel).toBe(2);
});
it('starts a newly unlocked chapter at band one and honors an explicit choice', () => {
 const m=ready();for(const c of m.state.account.cards)c.level=5;
 m.start(1,'campaign',4);m.state=R.abandonRun(m.state).state;m.state.cleared=[1];m.go('hub');
 render(<HomeV4 m={m}/>);
 expect((screen.getByRole('combobox',{name:'Challenge band'}) as HTMLSelectElement).value).toBe('1');
 fireEvent.change(screen.getByRole('combobox',{name:'Challenge band'}),{target:{value:'3'}});
 fireEvent.click(home().getByRole('button',{name:'Explore Rooftop Orchard'}));
 expect(m.state.run!.chapter).toBe(2);expect(m.state.run!.challengeLevel).toBe(3);
});
it('clamps a retained band to the current crew ceiling without rewriting the saved run', () => {
 const m=ready();for(const c of m.state.account.cards)c.level=5;
 m.start(1,'campaign',4);m.state=R.abandonRun(m.state).state;
 m.state.account.cards.find(c=>c.cardId==='soot')!.level=2;m.go('hub');
 const before=R.exportSave(m.state);render(<HomeV4 m={m}/>);
 expect((screen.getByRole('combobox',{name:'Challenge band'}) as HTMLSelectElement).value).toBe('2');
 expect(R.exportSave(m.state)).toBe(before);
 fireEvent.click(home().getByRole('button',{name:'Explore Tangled Cafe'}));
 expect(m.state.run!.challengeLevel).toBe(2);
});
