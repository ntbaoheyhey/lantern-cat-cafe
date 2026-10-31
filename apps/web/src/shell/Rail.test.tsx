// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Rail } from './Rail';
import { RAIL_SCREENS } from '../nav/screens';

afterEach(cleanup);

describe('Rail component', () => {
  it('renders root rail and contract data-testids', () => {
    const onSelect = vi.fn();
    render(<Rail activeScreen="home" onSelectScreen={onSelect} />);

    expect(screen.getByTestId('rail')).toBeTruthy();
    expect(screen.getByTestId('rail-logo')).toBeTruthy();
    expect(screen.getByTestId('rail-fuji')).toBeTruthy();

    for (const { id } of RAIL_SCREENS) {
      expect(screen.getByTestId(`nav-${id}`)).toBeTruthy();
    }
  });

  it('marks active screen with aria-current="page" and aria-selected="true"', () => {
    const onSelect = vi.fn();
    render(<Rail activeScreen="bag" onSelectScreen={onSelect} />);

    const activeItem = screen.getByTestId('nav-bag');
    expect(activeItem.getAttribute('aria-current')).toBe('page');
    expect(activeItem.getAttribute('aria-selected')).toBe('true');
    expect(activeItem.getAttribute('tabindex')).toBe('0');

    const homeItem = screen.getByTestId('nav-home');
    expect(homeItem.getAttribute('aria-current')).toBeNull();
    expect(homeItem.getAttribute('aria-selected')).toBe('false');
    expect(homeItem.getAttribute('tabindex')).toBe('-1');
  });

  it('navigates when clicking a rail item or the logo', () => {
    const onSelect = vi.fn();
    render(<Rail activeScreen="home" onSelectScreen={onSelect} />);

    fireEvent.click(screen.getByTestId('nav-forge'));
    expect(onSelect).toHaveBeenCalledWith('forge');

    fireEvent.click(screen.getByTestId('rail-logo'));
    expect(onSelect).toHaveBeenCalledWith('home');
  });

  it('supports arrow key navigation (ArrowDown, ArrowUp, Home, End)', () => {
    const onSelect = vi.fn();
    render(<Rail activeScreen="home" onSelectScreen={onSelect} />);

    const home = screen.getByTestId('nav-home');
    home.focus();

    fireEvent.keyDown(home, { key: 'ArrowDown' });
    expect(onSelect).toHaveBeenLastCalledWith('bag');

    fireEvent.keyDown(document.activeElement!, { key: 'ArrowUp' });
    expect(onSelect).toHaveBeenLastCalledWith('home');

    fireEvent.keyDown(document.activeElement!, { key: 'ArrowUp' });
    expect(onSelect).toHaveBeenLastCalledWith('help');

    fireEvent.keyDown(document.activeElement!, { key: 'Home' });
    expect(onSelect).toHaveBeenLastCalledWith('home');

    fireEvent.keyDown(document.activeElement!, { key: 'End' });
    expect(onSelect).toHaveBeenLastCalledWith('help');
  });
});
