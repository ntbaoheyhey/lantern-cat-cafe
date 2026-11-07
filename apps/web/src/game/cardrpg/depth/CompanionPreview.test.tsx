// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act, cleanup, render } from '@testing-library/react';
import { DepthModel } from './model';
import { CompanionPreview, CompanionPreviewProvider } from './CompanionPreview';

const miniature = vi.hoisted(() => ({
  playEntrance: vi.fn(), dispose: vi.fn(), invalidate: vi.fn(), ready: true,
}));
vi.mock('../../squad/turn3d/scene', () => ({ TurnScene: class {
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
