// @vitest-environment jsdom
import { useSyncExternalStore } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { DepthModel } from './model';
import { FeelLab } from './FeelLab';
import { BriefChecklist } from './LabEvidence';

vi.mock('./SharpnessEvidence', () => ({ SharpnessEvidence: () => <p>Native crops</p> }));
vi.mock('./MotionEvidence', () => ({ MotionEvidence: () => <p>Motion matrix</p> }));
vi.mock('./EffectEvidence', () => ({ EffectEvidence: () => <p>Effect matrix</p> }));
afterEach(cleanup);

function Lab({ model }: { model: DepthModel }) {
  useSyncExternalStore(model.subscribe, model.snapshot);
  return <><FeelLab m={model} home />{model.sceneStarted && <FeelLab m={model} />}</>;
}

it('opens the gallery from the cafe and returns with account progress intact', () => {
  const model = new DepthModel(true);
  const before = JSON.stringify(model.state);
  render(<Lab model={model} />);
  fireEvent.click(screen.getByRole('button', { name: 'Feel lab' }));
  fireEvent.click(screen.getByRole('button', { name: 'Play preview' }));
  expect(model.galleryBattle).toBeTruthy();
  expect(screen.getAllByRole('button', { name: 'Feel lab' })).toHaveLength(1);
  expect(screen.getByRole('region', { name: 'Feel lab' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Return to cafe' }));
  expect(model.showBattle).toBe(false);
  expect(model.screen).toBe('hub');
  expect(model.labOpen).toBe(false);
  expect(JSON.stringify(model.state)).toBe(before);
});

it('restores the watched battle and paused presentation after an isolated preview', () => {
  const model = new DepthModel(true);
  model.tutorial();
  model.fight();
  model.paused = true;
  model.animationAt = 123;
  const battle = model.battle;
  const before = JSON.stringify(model.state);
  render(<Lab model={model} />);
  fireEvent.click(screen.getByRole('button', { name: 'Feel lab' }));
  fireEvent.change(screen.getByLabelText('Preview action'), { target: { value: 'clover-4' } });
  fireEvent.change(screen.getByLabelText('Action progress'), { target: { value: '.5' } });
  expect(model.galleryId).toBe('clover-4');
  expect(model.animationAt).toBe(model.plan!.duration * .5);
  fireEvent.click(screen.getByRole('button', { name: 'Return to battle' }));
  expect(model.battle).toBe(battle);
  expect(model.paused).toBe(true);
  expect(model.animationAt).toBe(123);
  expect(JSON.stringify(model.state)).toBe(before);
});

it('hides gallery controls while preserving the preview and account', () => {
  const model = new DepthModel(true);
  const before = JSON.stringify(model.state);
  render(<Lab model={model} />);
  fireEvent.click(screen.getByRole('button', { name: 'Feel lab' }));
  fireEvent.click(screen.getByRole('button', { name: 'Play preview' }));
  const gallery = model.galleryBattle;
  const plan = model.plan;
  fireEvent.click(screen.getByRole('button', { name: 'Hide controls' }));
  expect(screen.queryByRole('region', { name: 'Feel lab' })).toBeNull();
  expect(model.galleryBattle).toBe(gallery);
  expect(model.plan).toBe(plan);
  expect(model.showBattle).toBe(true);
  expect(model.paused).toBe(false);
  expect(JSON.stringify(model.state)).toBe(before);
  fireEvent.click(screen.getByRole('button', { name: 'Feel lab' }));
  expect(screen.getByRole('region', { name: 'Feel lab' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Return to cafe' }));
  expect(model.galleryBattle).toBeNull();
  expect(JSON.stringify(model.state)).toBe(before);
});

it('keeps the performance overlay enabled after closing the drawer', () => {
  const model = new DepthModel(true);
  render(<Lab model={model} />);
  fireEvent.click(screen.getByRole('button', { name: 'Feel lab' }));
  fireEvent.click(screen.getByRole('button', { name: 'Performance' }));
  fireEvent.click(screen.getByLabelText('Show live frame overlay'));
  fireEvent.change(screen.getByLabelText('Quality tier'), { target: { value: 'low' } });
  fireEvent.click(screen.getByRole('button', { name: 'Return to cafe' }));
  expect(model.labPerformance).toBe(true);
  expect(model.state.settings.quality).toBe('low');
});

it('navigates from the brief checklist using the existing destinations', () => {
  const model = new DepthModel(true);
  render(<Lab model={model} />);
  fireEvent.click(screen.getByRole('button', { name: 'Feel lab' }));
  fireEvent.click(screen.getByRole('button', { name: 'Brief checklist' }));
  expect(screen.getAllByRole('listitem')).toHaveLength(12);
  fireEvent.click(screen.getByRole('button', { name: 'Open invitations' }));
  expect(model.screen).toBe('gacha');
  expect(model.labOpen).toBe(false);
});

it('protects a running fight from checklist navigation', () => {
  const model = new DepthModel(true);
  model.tutorial();
  model.fight();
  render(<BriefChecklist m={model} />);
  const destination = screen.getByRole('button', { name: 'Open invitations' });
  expect((destination as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(destination);
  expect(model.watching).toBe(true);
  expect(model.screen).toBe('map');
});

it('closes an isolated gallery with Escape', () => {
  const model = new DepthModel(true);
  render(<Lab model={model} />);
  fireEvent.click(screen.getByRole('button', { name: 'Feel lab' }));
  fireEvent.click(screen.getByRole('button', { name: 'Play preview' }));
  fireEvent.keyDown(window, { key: 'Escape' });
  expect(model.galleryBattle).toBeNull();
  expect(model.labOpen).toBe(false);
});
