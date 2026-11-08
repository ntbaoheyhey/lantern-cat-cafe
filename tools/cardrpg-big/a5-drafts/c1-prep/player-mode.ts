/** Review controls are opt-in for Gameplay v4; historical mode keeps its shell. */
export function showReviewTools(v4: boolean, search = typeof location === 'undefined' ? '' : location.search): boolean {
  return !v4 || new URLSearchParams(search).get('dev') === '1';
}
