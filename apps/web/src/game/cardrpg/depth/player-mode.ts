/** Player shells expose review tools only through an explicit dev=1. */
export function showReviewTools(_v4: boolean, search = typeof location === 'undefined' ? '' : location.search): boolean {
  return new URLSearchParams(search).get('dev') === '1';
}
