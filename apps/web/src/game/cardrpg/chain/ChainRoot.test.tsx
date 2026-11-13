import {act, cleanup, fireEvent, render, screen} from '@testing-library/react';
import {afterEach, expect, it, vi} from 'vitest';
import {ChainDock} from './ChainRoot';

vi.mock('wagmi', () => ({
  useAccount: () => ({}), useWalletClient: () => ({}),
  useConnect: () => ({connectAsync: vi.fn(), connectors: []}), useSignMessage: () => ({signMessageAsync: vi.fn()}),
}));
vi.mock('../../../wallet/WalletProvider', () => ({useSession: () => null, useAuthContext: () => ({api: {}, store: {}})}));
afterEach(() => {cleanup(); vi.unstubAllEnvs();});
it('keeps the integrated battle controls clear until wallet access is requested', () => {
  vi.stubEnv('VITE_CHAIN_DEMO', '1');
  render(<ChainDock embedded/>);
  expect(screen.queryByRole('button')).toBeNull();
  act(() => window.dispatchEvent(new Event('chain:wallet')));
  expect(screen.getByRole('button', {name:'Play as guest'})).toBeTruthy();
  expect(document.activeElement).toBe(screen.getByRole('region', {name:'Fuji panel'}));
  fireEvent.keyDown(document.activeElement!, {key:'Escape'});
  expect(screen.queryByRole('button')).toBeNull();
  act(() => window.dispatchEvent(new Event('chain:wallet')));
  fireEvent.click(screen.getByRole('button', {name:'Close Fuji'}));
  expect(screen.queryByRole('button')).toBeNull();
});
it('keeps guest creation disabled when only the market flag is enabled', () => {
  vi.stubEnv('VITE_CHAIN_DEMO', '0'); vi.stubEnv('VITE_GUEST_WALLET', '0'); vi.stubEnv('VITE_CHAIN_LOOP', '1');
  render(<ChainDock/>);
  expect(screen.queryByRole('button', {name: 'Play as guest'})).toBeNull();
  expect(screen.getByRole('button', {name: 'Connect'})).toBeTruthy();
});
it('enables guest sign-in in the demo and ignores room events when chainLoop is off', () => {
  vi.stubEnv('VITE_CHAIN_DEMO', '0'); vi.stubEnv('VITE_GUEST_WALLET', '1'); vi.stubEnv('VITE_CHAIN_LOOP', '0');
  render(<ChainDock/>);
  expect(screen.getByRole('button', {name: 'Play as guest'})).toBeTruthy();
  act(() => window.dispatchEvent(new CustomEvent('chain:open', {detail: 'Market'})));
  expect(screen.queryByRole('dialog')).toBeNull();
});
