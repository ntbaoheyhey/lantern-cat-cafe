import {act, cleanup, fireEvent, render, screen} from '@testing-library/react';
import {afterEach, beforeEach, expect, it, vi} from 'vitest';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import {DepthModel} from './model';
import {AdviceV4} from './AdviceV4';
import {QuickUpgradeA6} from '../ui-v3/PowerA6';

const mock = vi.hoisted(() => ({fail: false, workers: [] as Array<{
  onmessage?: (event: {data: unknown}) => void;
  onerror?: () => void;
  request?: {key: string; state: R.DepthAccount; setup: R.BattleSetup};
  terminate: ReturnType<typeof vi.fn>;
}>}));
vi.mock('./advice-worker?worker&inline', () => ({default: class {
  onmessage?: (event: {data: unknown}) => void;
  onerror?: () => void;
  request?: {key: string; state: R.DepthAccount; setup: R.BattleSetup};
  terminate = vi.fn();
  constructor() {if (mock.fail) throw Error('Worker unavailable'); mock.workers.push(this);}
  postMessage(request: {key: string; state: R.DepthAccount; setup: R.BattleSetup}) {this.request = request;}
}}));
beforeEach(() => vi.useFakeTimers());
afterEach(() => {cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); mock.fail = false; mock.workers.length = 0;});

function loss(a6 = true) {
  const m = new DepthModel(true, true, true, true);
  m.state = a6 ? R.setGameplayA6(R.createDepthAccount(38, 0), true) : R.setGameplayV4(R.createDepthAccount(38, 0), true);
  m.state.tutorial = 4;
  m.state = R.startRun(m.state, 1, 38).state;
  m.state = R.enterNode(m.state, R.availableNodes(m.state.run!)[0]!.id).state;
  m.state.run!.battle!.result = 'enemy'; // Controlled finished encounter, not earned play.
  m.screen = 'result';
  return m;
}
function advice(worker: typeof mock.workers[number], paid = false): R.BuildAdviceV4 {
  const state = worker.request!.state;
  const change: R.BuildChangeV4 = paid ? {kind:'level', cardId:state.account.cards[0]!.id} : {kind:'plan', plan:{...state.v4!.plan, care:state.v4!.plan.care === 'protect' ? 'steady' : 'protect'}};
  const changed = R.changeBuildV4(state, change);
  expect(changed.ok).toBe(true);
  const cost = Object.fromEntries(Object.entries(state.account.currencies).flatMap(([id,n]) => {
    const used = n - changed.state.account.currencies[id as keyof typeof state.account.currencies];
    return used > 0 ? [[id, used]] : [];
  }));
  return {change, label:paid?'Train Mochi for the next route':'Change the crew care plan', cost,
    expectedBuild:worker.request!.key, before:{wins:0, margin:0}, after:{wins:1, margin:0.1}, samples:10};
}
function reply(worker: typeof mock.workers[number], result: R.BuildAdviceV4 | null) {
  act(() => worker.onmessage!({data:{key:worker.request!.key, result}}));
}
const region = () => screen.getByRole('region', {name:'Your next change'});

it('waits for the comparison before enabling a fallback review without settling or spending', () => {
  const m = loss(), before = R.exportSave(m.state);
  render(<AdviceV4 m={m}/>);
  expect(region().getAttribute('aria-busy')).toBe('true');
  const pending=screen.getByRole('button',{name:'Finding your next change…'});
  expect((pending as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(pending);
  expect(m.screen).toBe('result');
  expect(R.exportSave(m.state)).toBe(before);
  reply(mock.workers[0]!,null);
  expect(region().getAttribute('aria-busy')).toBe('false');
  const option = R.upgradeOptionsA6(mock.workers[0]!.request!.state).sort((a,b) => Object.values(a.cost).reduce((n,v) => n+v,0)-Object.values(b.cost).reduce((n,v) => n+v,0))[0]!;
  expect(screen.getByText(option.label)).toBeTruthy();
  for (const [id,n] of Object.entries(option.cost)) expect(region().textContent).toContain(`${n} ${id}`);
  expect((screen.getByRole('button', {name:/Review .* training|Review this gear/}) as HTMLButtonElement).disabled).toBe(false);
  expect(region().textContent).toContain('review before buying');
  expect(R.exportSave(m.state)).toBe(before);
});

it('applies the quoted paid recommendation once and begins a fresh route with that purchase', () => {
  const m = loss(); render(<AdviceV4 m={m}/>);
  const worker = mock.workers[0]!, recommendation = advice(worker, true);
  const expected = R.applyResultAdviceV4(m.state, recommendation);
  expect(expected.ok).toBe(true);
  reply(worker, recommendation);
  expect(screen.getByText(Object.entries(recommendation.cost).map(([id,n]) => `${n} ${id}`).join(' · '))).toBeTruthy();
  const apply = screen.getByRole('button', {name:'Apply and retry route'});
  fireEvent.click(apply);
  expect(m.state.account.currencies).toEqual(expected.state.account.currencies);
  expect(m.state.account.cards).toEqual(expected.state.account.cards);
  expect(m.screen).toBe('prepare');
  expect(m.state.run!.current).toBe(m.state.run!.nodes[0]!.id);
  const once = R.exportSave(m.state); fireEvent.click(apply); expect(R.exportSave(m.state)).toBe(once);
  expect(worker.terminate).toHaveBeenCalled();
});

it('labels free recommendations and a Tower retry accurately', () => {
  const m = loss(); m.state.run!.towerA6 = {enemyStats:{}};
  render(<AdviceV4 m={m}/>); reply(mock.workers[0]!, advice(mock.workers[0]!));
  expect(screen.getByText('No currency needed.')).toBeTruthy();
  expect(screen.getByRole('button', {name:'Apply and retry floor'})).toBeTruthy();
  expect(region().textContent).toContain('Retry Tower floor 1 with full crew HP.');
  expect(region().textContent).not.toContain('fresh route');
});

it('ends an unanswered comparison, ignores its late answer and reviews without purchasing', () => {
  const m = loss(); render(<AdviceV4 m={m}/>);
  const worker = mock.workers[0]!, late = advice(worker), settled = R.resultAdviceStateV4(m.state);
  act(() => vi.advanceTimersByTime(8_000));
  expect(region().getAttribute('data-advice-state')).toBe('timeout');
  expect(screen.queryByText('Comparing crew changes…')).toBeNull();
  reply(worker, late);
  expect(screen.queryByRole('button', {name:'Apply and retry route'})).toBeNull();
  expect(worker.terminate).toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', {name:/Review .* training|Review this gear/}));
  expect(['collection','inventory']).toContain(m.screen);
  expect(m.state.account.currencies).toEqual(settled.state.account.currencies);
  expect(m.state.account.cards).toEqual(settled.state.account.cards);
});

it.each(['constructor','runtime','response'] as const)('retains an available review after a %s error', kind => {
  const m = loss(), before = R.exportSave(m.state); mock.fail = kind === 'constructor';
  render(<AdviceV4 m={m}/>);
  if (kind === 'runtime') act(() => mock.workers[0]!.onerror!());
  if (kind === 'response') act(() => mock.workers[0]!.onmessage!({data:{key:mock.workers[0]!.request!.key, error:'comparison failed'}}));
  expect(region().getAttribute('data-advice-state')).toBe('unavailable');
  expect(screen.getByRole('button', {name:/Review .* training|Review this gear/})).toBeTruthy();
  expect(R.exportSave(m.state)).toBe(before);
  act(() => vi.advanceTimersByTime(20_000));
  expect(region().getAttribute('data-advice-state')).toBe('unavailable');
});

it('offers free formation review when no purchase is affordable without inventing an upgrade', () => {
  const m = loss();
  for (const id of Object.keys(m.state.account.currencies) as Array<keyof typeof m.state.account.currencies>) m.state.account.currencies[id] = 0;
  m.state.account.daily.earned = {...R.depthCaps(m.state)};
  render(<AdviceV4 m={m}/>); reply(mock.workers[0]!, null);
  const settled = R.resultAdviceStateV4(m.state);
  expect(screen.getByText('Formation changes are free.')).toBeTruthy();
  expect(screen.queryByText('The comparison is unavailable. You can still prepare your crew.')).toBeNull();
  fireEvent.click(screen.getByRole('button', {name:'Review team formation'}));
  expect(m.screen).toBe('team');
  expect(m.state.account.currencies).toEqual(settled.state.account.currencies);
  expect(m.state.account.cards).toEqual(settled.state.account.cards);
});

it('rejects a replaced build and unrelated replies while keeping the current comparison alive', () => {
  const m = loss(), ui = render(<AdviceV4 m={m}/>), old = mock.workers[0]!, stale = advice(old);
  m.state = structuredClone(m.state); m.state.account.currencies.fish++;
  ui.rerender(<AdviceV4 m={m}/>); const current = mock.workers[1]!;
  reply(old, stale);
  act(() => current.onmessage!({data:{key:'old build', result:stale}}));
  expect(region().getAttribute('data-advice-state')).toBe('checking');
  expect(old.terminate).toHaveBeenCalled();
  expect(current.terminate).not.toHaveBeenCalled();
  reply(current, advice(current));
  expect(region().getAttribute('data-advice-state')).toBe('ready');
});

it('does not reuse an earlier encounter answer for an identical crew', () => {
  const m = loss(), ui = render(<AdviceV4 m={m}/>), old = mock.workers[0]!;
  reply(old, advice(old));
  m.state = structuredClone(m.state); m.state.run!.battle!.initial.seed++;
  ui.rerender(<AdviceV4 m={m}/>);
  expect(mock.workers[1]!.request!.key).toBe(old.request!.key);
  expect(region().getAttribute('data-advice-state')).toBe('checking');
  expect(screen.queryByRole('button', {name:'Apply and retry route'})).toBeNull();
});

it.each(['checking', 'ready', 'timeout'] as const)('preserves %s advice when a discovery receipt clones the same encounter', status => {
  const m = loss(), ui = render(<AdviceV4 m={m}/>), worker = mock.workers[0]!;
  if (status === 'ready') reply(worker, advice(worker));
  if (status === 'timeout') act(() => vi.advanceTimersByTime(8_000));
  if (status === 'checking') act(() => vi.advanceTimersByTime(6_000));
  const receipt = m.state.v4!.journey!.pending[0]!;
  expect(receipt).toBeTruthy();
  const battle = m.battle, build = R.adviceBuildKeyV4(m.state);
  const acknowledged = R.acknowledgeDiscoveryV4(m.state, receipt.sequence);
  expect(acknowledged.ok).toBe(true);
  m.state = acknowledged.state;
  expect(m.battle).not.toBe(battle);
  expect(m.battle!.initial).toEqual(battle!.initial);
  expect(R.adviceBuildKeyV4(m.state)).toBe(build);
  ui.rerender(<AdviceV4 m={m}/>);
  expect(mock.workers).toHaveLength(1);
  expect(region().getAttribute('data-advice-state')).toBe(status);
  if (status === 'checking') {
    expect(worker.terminate).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(2_000));
    expect(region().getAttribute('data-advice-state')).toBe('timeout');
  }
});

it('releases a pending comparison on unmount and skips tutorial and replay advice', () => {
  const m = loss(), ui = render(<AdviceV4 m={m}/>), worker = mock.workers[0]!;
  ui.unmount(); expect(worker.terminate).toHaveBeenCalled();
  reply(worker, advice(worker)); act(() => vi.advanceTimersByTime(20_000));
  expect(screen.queryByRole('region', {name:'Your next change'})).toBeNull();
  m.tutorialBattle = m.state.run!.battle!; const tutorial = render(<AdviceV4 m={m}/>);
  expect(mock.workers).toHaveLength(1); tutorial.unmount();
  m.tutorialBattle = null; m.replay = m.state.run!.battle!; render(<AdviceV4 m={m}/>);
  expect(mock.workers).toHaveLength(1);
});

it('keeps legacy no-change guidance and provides its bounded error fallback', () => {
  const m = loss(false), ui = render(<AdviceV4 m={m}/>); reply(mock.workers[0]!, null);
  expect(screen.getByText('No stronger available change stood out in this forecast.')).toBeTruthy();
  expect(screen.getByRole('button', {name:'Open team preparation'})).toBeTruthy();
  m.state = structuredClone(m.state); m.state.account.currencies.fish++; ui.rerender(<AdviceV4 m={m}/>);
  act(() => vi.advanceTimersByTime(8_000));
  expect(screen.getByText('The suggestion is unavailable. Review your crew before returning.')).toBeTruthy();
});

it('keeps a stale Apply click atomic when the crew changes before rerender', () => {
  const m = loss(); render(<AdviceV4 m={m}/>);
  reply(mock.workers[0]!, advice(mock.workers[0]!, true));
  m.state = structuredClone(m.state); m.state.account.currencies.fish++;
  const before = R.exportSave(m.state);
  fireEvent.click(screen.getByRole('button', {name:'Apply and retry route'}));
  expect(R.exportSave(m.state)).toBe(before);
  expect(m.screen).toBe('result');
  expect(m.error).toBe(true);
  expect(m.notice).toContain('Your crew changed');
});

it.each(['no-change', 'timeout', 'unavailable'] as const)('reviews a free owned-gear improvement before paid fallback training after %s', status => {
  const m = loss();
  m.state.gear.push(R.makeGear(m.state, 'hearthloom-weapon-epic', 24));
  const before = R.exportSave(m.state), settled = R.resultAdviceStateV4(m.state);
  const expected = R.autoEquipA6(settled.state);
  expect(expected.ok).toBe(true);
  expect(R.upgradeOptionsA6(settled.state).length).toBeGreaterThan(0);
  const power = Math.round(R.teamPowerV4(settled.state)), after = Math.round(R.teamPowerV4(expected.state));
  const ui = render(<AdviceV4 m={m}/>);
  if(status === 'timeout')act(() => vi.advanceTimersByTime(8_000));
  else if(status === 'unavailable')act(() => mock.workers[0]!.onerror!());
  else reply(mock.workers[0]!, null);
  expect(screen.getByText(`Crew Power ${power.toLocaleString('en-US')} to ${after.toLocaleString('en-US')} (+${(after-power).toLocaleString('en-US')}).`)).toBeTruthy();
  const review = screen.getByRole('button', {name:'Review owned gear'});
  expect(review.getAttribute('aria-describedby')!.split(' ').map(id=>document.getElementById(id)!.textContent).join(' ')).toContain('No currency needed.');
  expect(R.exportSave(m.state)).toBe(before);
  fireEvent.click(review);
  expect(m.screen).toBe('team');
  expect(m.state).toEqual(settled.state);
  ui.unmount(); render(<QuickUpgradeA6 m={m}/>);
  fireEvent.click(screen.getByRole('button', {name:'Auto-equip best gear'}));
  expect(m.state).toEqual(expected.state);
  expect(m.state.account.currencies).toEqual(settled.state.account.currencies);
});

it('keeps the completed recommendation ahead of the free fallback and quotes its exact paid result', () => {
  const m = loss(); m.state.gear.push(R.makeGear(m.state, 'hearthloom-weapon-epic', 24));
  render(<AdviceV4 m={m}/>);
  const worker=mock.workers[0]!, recommendation=advice(worker, true), expected=R.applyAdviceV4(worker.request!.state, recommendation);
  const before=Math.round(R.teamPowerV4(worker.request!.state)), after=Math.round(R.teamPowerV4(expected.state));
  reply(worker, recommendation);
  expect(screen.queryByRole('button', {name:'Review owned gear'})).toBeNull();
  expect(screen.getByText(`Crew Power ${before.toLocaleString('en-US')} to ${after.toLocaleString('en-US')} (+${(after-before).toLocaleString('en-US')}).`)).toBeTruthy();
  const apply=screen.getByRole('button', {name:'Apply and retry route'});
  const description=apply.getAttribute('aria-describedby')!.split(' ').map(id=>document.getElementById(id)!.textContent).join(' ');
  expect(description).toContain('Restart chapter 1 at its first stop with full crew HP.');
  expect(description).toContain('Cost:');
  fireEvent.click(apply);
  expect(m.state.account).toEqual(expected.state.account);
  expect(m.battle!.actors.filter(a=>a.side==='party').every(a=>a.hp===a.maxHp)).toBe(true);
});

it('describes a free tactical change without inventing a Power gain', () => {
  const m=loss(); render(<AdviceV4 m={m}/>); reply(mock.workers[0]!,advice(mock.workers[0]!));
  expect(screen.getByText(`Crew Power stays ${Math.round(R.teamPowerV4(m.state)).toLocaleString('en-US')}.`)).toBeTruthy();
});

it('applies Tower advice for an under-level crew and prepares that same fixed floor', () => {
  const m=loss();m.state.run=null;m.state.cleared=[1];m.state.towerBest=4;
  m.state=R.startTowerFloorA6(m.state,5).state;
  m.state=R.enterNode(m.state,R.availableNodes(m.state.run!)[0]!.id).state;
  m.state.run!.battle!.result='enemy';
  const floor=structuredClone(m.state.run!);
  render(<AdviceV4 m={m}/>);reply(mock.workers[0]!,advice(mock.workers[0]!,true));
  fireEvent.click(screen.getByRole('button',{name:'Apply and retry floor'}));
  expect(m.error).toBe(false);expect(m.screen).toBe('prepare');
  expect(m.state.run!.floor).toBe(5);expect(m.state.run!.seed).toBe(floor.seed);
  expect(m.state.run!.towerA6).toEqual(floor.towerA6);
  expect(m.battle!.actors.filter(a=>a.side==='party').every(a=>a.hp===a.maxHp)).toBe(true);
});
