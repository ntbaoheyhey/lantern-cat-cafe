/** Product default is OFF. Demo builds explicitly opt in. */
export function uiV3Enabled(search = typeof location === 'undefined' ? '' : location.search, build = import.meta.env.VITE_UI_V3 === '1'): boolean {
  const choice = new URLSearchParams(search).get('ui');
  return choice === 'v3' || (choice !== 'legacy' && build);
}
