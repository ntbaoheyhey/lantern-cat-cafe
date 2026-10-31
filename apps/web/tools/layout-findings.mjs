// Self-contained so Playwright can pass this function directly to page.evaluate().
// Measures visible boxes after ancestor/viewport clipping, excluding ancestor pairs.
// This is a geometry heuristic, not a pixel-occlusion or text-clipping proof.
export function layoutFindings() {
  const tolerance = 1;
  const doc = document.documentElement, body = document.body;
  const dimensions = {
    viewportWidth: innerWidth, viewportHeight: innerHeight,
    scrollWidth: Math.max(doc.scrollWidth, body.scrollWidth),
    scrollHeight: Math.max(doc.scrollHeight, body.scrollHeight),
    scrollX, scrollY,
  };
  const describe = el => el.getAttribute('data-testid') || el.id ||
    `${el.tagName.toLowerCase()}${el.classList.length ? `.${[...el.classList].join('.')}` : ''}${el.getAttribute('aria-label') ? `[${el.getAttribute('aria-label')}]` : ''}`;
  const visibleRect = el => {
    const style = getComputedStyle(el);
    if (style.display === 'none' || style.visibility !== 'visible' || Number(style.opacity) === 0 || !el.getClientRects().length) return null;
    const rect = el.getBoundingClientRect();
    let left = rect.left, right = rect.right, top = rect.top, bottom = rect.bottom;
    for (let parent = el.parentElement; parent; parent = parent.parentElement) {
      const s = getComputedStyle(parent), r = parent.getBoundingClientRect();
      if (s.visibility !== 'visible' || Number(s.opacity) === 0) return null;
      if (/(auto|scroll|hidden|clip)/.test(s.overflowX)) { left = Math.max(left, r.left); right = Math.min(right, r.right); }
      if (/(auto|scroll|hidden|clip)/.test(s.overflowY)) { top = Math.max(top, r.top); bottom = Math.min(bottom, r.bottom); }
    }
    if (right <= left || bottom <= top || bottom <= 0 || top >= innerHeight) return null;
    return { left, right, top, bottom };
  };
  const horizontalOverflow = [];
  for (const el of body.querySelectorAll('*')) {
    // SVG internals have intentional drawing bounds; inspect their outer element instead.
    if (!(el instanceof HTMLElement)) continue;
    const r = visibleRect(el);
    if (r && (r.left < -tolerance || r.right > innerWidth + tolerance)) {
      horizontalOverflow.push({ element: describe(el), left: Math.round(r.left), right: Math.round(r.right) });
    }
  }
  const selectors = '[data-testid="rail"], [data-testid="hud"], [data-testid="screen"], [data-testid^="hud-"], .v2-topbar, .v2-stage, .v2-panel, .v2-tabs, button, a[href], input, select, textarea, [role="tab"], h1, h2, h3';
  const boxes = [...body.querySelectorAll(selectors)].flatMap(el => {
    const r = visibleRect(el);
    if (!r) return [];
    const box = { left: Math.max(0, r.left), right: Math.min(innerWidth, r.right), top: Math.max(0, r.top), bottom: Math.min(innerHeight, r.bottom) };
    return box.right > box.left && box.bottom > box.top ? [{ el, box }] : [];
  });
  const elementOverlap = [];
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
    const a = boxes[i], b = boxes[j];
    if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
    const width = Math.min(a.box.right, b.box.right) - Math.max(a.box.left, b.box.left);
    const height = Math.min(a.box.bottom, b.box.bottom) - Math.max(a.box.top, b.box.top);
    if (width > tolerance && height > tolerance) elementOverlap.push({ first: describe(a.el), second: describe(b.el), width: Math.round(width), height: Math.round(height) });
  }
  return {
    dimensions,
    documentScroll: dimensions.scrollHeight > innerHeight + tolerance || dimensions.scrollWidth > innerWidth + tolerance || Math.abs(scrollX) > tolerance || Math.abs(scrollY) > tolerance,
    horizontalOverflow, elementOverlap,
  };
}
