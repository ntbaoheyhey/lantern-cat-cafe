// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { v2 } from '@taskbar-hero/game-rules';
import { StacksBar } from './StacksBar';

describe('StacksBar', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders fish, yarn, and keys with formatted amounts and cap from content', () => {
    render(<StacksBar fish={1234} yarn={56} keys={2} />);

    const catKeyDef = v2.MATERIALS.find((m) => m.id === 'catKey')!;
    expect(catKeyDef).toBeDefined();

    expect(screen.getByText('1,234')).toBeTruthy();
    expect(screen.getByText('56')).toBeTruthy();
    expect(screen.getByText(`2/${catKeyDef.maxStack}`)).toBeTruthy();
  });

  it('provides accessible names for screen readers via list items', () => {
    render(<StacksBar fish={1234} yarn={56} keys={2} />);

    const catKeyDef = v2.MATERIALS.find((m) => m.id === 'catKey')!;

    expect(screen.getByRole('list', { name: 'Currencies and keys' })).toBeTruthy();
    expect(screen.getByRole('listitem', { name: 'Fish 1,234' })).toBeTruthy();
    expect(screen.getByRole('listitem', { name: 'Yarn 56' })).toBeTruthy();
    expect(screen.getByRole('listitem', { name: `Cat Keys 2 of ${catKeyDef.maxStack}` })).toBeTruthy();
  });

  it('renders decorative aria-hidden pixel icons', () => {
    const { container } = render(<StacksBar fish={500} yarn={20} keys={1} />);

    const svgs = container.querySelectorAll('svg');
    expect(svgs).toHaveLength(3);
    svgs.forEach((svg) => {
      expect(svg.getAttribute('aria-hidden')).toBe('true');
    });
  });
});
