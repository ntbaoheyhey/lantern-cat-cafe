// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act, cleanup, render } from '@testing-library/react';
import { DepthModel } from './model';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import { CompanionPreview, CompanionPreviewProvider } from './CompanionPreview';

const miniature = vi.hoisted(() => ({
  playEntrance: vi.fn(), dispose: vi.fn(), invalidate: vi.fn(), ready: true, getView: null as null | (()=>{earnedReveal?:unknown}),
}));
vi.mock('../../squad/turn3d/scene', () => ({ TurnScene: class {
  constructor(_host: unknown, getView: ()=>{earnedReveal?:unknown}) { miniature.getView=getView; }
  get ready() { return miniature.ready; }
  playEntrance = miniature.playEntrance;
  dispose = miniature.dispose;
  invalidate = miniature.invalidate;
} }));

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  miniature.ready = true;
  miniature.playEntrance.mockResolvedValue(true);
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) =>
    window.setTimeout(() => callback(performance.now()), 16));
  vi.stubGlobal('cancelAnimationFrame', (handle: number) => window.clearTimeout(handle));
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });

it('waits for model readiness and plays each reveal once on the existing scene', async () => {
  const model = new DepthModel(true);
  miniature.ready = false;
  const view = render(<CompanionPreview m={model} id="clover" entranceKey="pull-1" />);
  await act(() => vi.advanceTimersByTimeAsync(300));
  expect(miniature.playEntrance).not.toHaveBeenCalled();
  miniature.ready = true;
  await act(() => vi.advanceTimersByTimeAsync(500));
  expect(miniature.playEntrance).toHaveBeenCalledExactlyOnceWith('clover');
  view.rerender(<CompanionPreview m={model} id="clover" entranceKey="pull-2" />);
  await act(() => vi.advanceTimersByTimeAsync(500));
  expect(miniature.playEntrance).toHaveBeenCalledTimes(2);
  expect(miniature.dispose).not.toHaveBeenCalled();
  view.unmount();
  expect(miniature.dispose).toHaveBeenCalledTimes(1);
});

it('retries an entrance while the selected model is still loading', async () => {
  miniature.playEntrance.mockResolvedValueOnce(false).mockResolvedValue(true);
  render(<CompanionPreview m={new DepthModel(true)} id="clover" entranceKey="pull-1" />);
  await act(() => vi.advanceTimersByTimeAsync(1000));
  expect(miniature.playEntrance).toHaveBeenCalledTimes(2);
});

it('keeps a hidden reveal inactive and stops its timer on unmount', async () => {
  const view = render(<CompanionPreview m={new DepthModel(true)} id="clover" entranceKey="pull-1" visible={false} />);
  await act(() => vi.advanceTimersByTimeAsync(400));
  expect(miniature.playEntrance).not.toHaveBeenCalled();
  view.unmount();
  await act(() => vi.advanceTimersByTimeAsync(400));
  expect(miniature.playEntrance).not.toHaveBeenCalled();
  expect(vi.getTimerCount()).toBe(0);
});

it('keeps one scene across screen slots and disposes only with the app', async () => {
  const model = new DepthModel(true);
  const view = render(<CompanionPreviewProvider m={model}><CompanionPreview key="collection" m={model} id="clover" /></CompanionPreviewProvider>);
  await act(() => vi.advanceTimersByTimeAsync(400));
  const scene = window.__depthPreviewScene;
  expect(scene).toBeTruthy();
  view.rerender(<CompanionPreviewProvider m={model}><div>Team</div></CompanionPreviewProvider>);
  await act(() => vi.advanceTimersByTimeAsync(100));
  expect(miniature.dispose).not.toHaveBeenCalled();
  view.rerender(<CompanionPreviewProvider m={model}><CompanionPreview key="invitation" m={model} id="mochi" entranceKey="pull-3" /></CompanionPreviewProvider>);
  await act(() => vi.advanceTimersByTimeAsync(400));
  expect(window.__depthPreviewScene).toBe(scene);
  expect(miniature.playEntrance).toHaveBeenCalledExactlyOnceWith('mochi');
  expect(miniature.dispose).not.toHaveBeenCalled();
  view.unmount();
  expect(miniature.dispose).toHaveBeenCalledTimes(1);
  expect(window.__depthPreviewScene).toBeUndefined();
  expect(vi.getTimerCount()).toBe(0);
});

it('forwards the exact active receipt to the scene view only while V4 is enabled', async () => {
  const model=new DepthModel(true,true);
  const receipt:R.GameplayEventV4={version:1,kind:'earned-reveal',sequence:0,round:0,bannerId:'standard',draw:1,itemId:'clover',rarity:'epic',duplicate:0,pityBefore:0,pityAfter:1,text:'Earned Clover.'};
  const view=render(<CompanionPreview m={model} id="clover" entranceKey="standard-1" earnedReveal={receipt}/>);
  await act(()=>vi.advanceTimersByTimeAsync(400));
  expect(miniature.getView?.().earnedReveal).toBe(receipt);
  model.state=R.setGameplayV4(model.state,false);
  view.rerender(<CompanionPreview m={model} id="clover" entranceKey="standard-1" earnedReveal={receipt}/>);
  expect(miniature.getView?.()).not.toHaveProperty('earnedReveal');
});
