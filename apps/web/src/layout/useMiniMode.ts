import { useCallback, useState } from 'react';

export const MINI_MODE_KEY = 'taskbar-hero.miniMode';

function read(): boolean {
  try {
    return window.localStorage.getItem(MINI_MODE_KEY) === '1';
  } catch {
    return false;
  }
}

/** Mini mode = the classic 96 px strip. The choice is remembered in localStorage when it is available. */
export function useMiniMode(): [boolean, (mini: boolean) => void] {
  const [mini, setMiniState] = useState(read);
  const setMini = useCallback((next: boolean) => {
    setMiniState(next);
    try {
      window.localStorage.setItem(MINI_MODE_KEY, next ? '1' : '0');
    } catch {
      /* not remembered; the toggle still works for this visit */
    }
  }, []);
  return [mini, setMini];
}
