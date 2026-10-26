// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { TodayRelicCard, txUrl } from './TodayRelicCard';

const hash = `0x${'aB'.repeat(32)}` as const;
afterEach(cleanup);
it.each(['', '0x12', `0x${'z'.repeat(64)}`, `${hash}/other`, `${hash}?query`, 'javascript:alert(1)'])('does not link a malformed transaction hash %s', txHash => {
  render(<TodayRelicCard today={{ relicId: '1', rarityName: 'common', minted: true, txHash: txHash as `0x${string}` }} mintable={false} canReissue={false} />);
  expect(screen.queryByRole('link')).toBeNull();
  expect(screen.getByTestId('forge-today-status').textContent).toBe('In your wallet');
  expect(txUrl(txHash)).toBeUndefined();
});
it('links an exact 32-byte mixed-case hash to the fixed explorer', () => {
  render(<TodayRelicCard today={{ relicId: '1', rarityName: 'common', minted: true, txHash: hash }} mintable={false} canReissue={false} />);
  expect(screen.getByRole('link').getAttribute('href')).toBe(`https://testnet.snowtrace.io/tx/${hash}`);
});
