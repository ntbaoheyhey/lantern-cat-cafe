import { expect, type Page } from './test';

/** Sample painted frames after the first labelled surface; a hidden app title is insufficient. */
export async function watchVisibleRoot(page: Page) {
  await page.addInitScript(() => {
    const guard = { armed: false, blankFrames: [] as { time: number; hash: string; text: string; nodes: unknown[] }[], probe: () => 0 };
    guard.probe = () => [...document.querySelectorAll<HTMLElement>('#root h1, #root h2, #root h3, #root p, #root button, #root [role="status"], [role="dialog"] h2, [role="dialog"] button')]
      .filter(node => {
        const rect = node.getBoundingClientRect(), style = getComputedStyle(node);
        return (node.textContent?.trim().length ?? 0) > 0 && rect.width > 4 && rect.height > 8 && rect.bottom > 0 && rect.top < innerHeight && rect.right > 0 && rect.left < innerWidth && style.visibility !== 'hidden' && Number(style.opacity) > 0;
      }).length;
    Object.assign(window, { __visibleRootGuard: guard });
    const frame = () => {
      const visible = guard.probe();
      if (visible) guard.armed = true;
      else if (guard.armed) guard.blankFrames.push({ time: performance.now(), hash: location.hash, text: (document.getElementById('root')?.innerText ?? '').slice(0, 500), nodes: [...document.querySelectorAll<HTMLElement>('#root h1, #root h2, #root p, #root button, #root [role], [role="dialog"]')].slice(0, 20).map(node => ({ tag: node.tagName, cls: node.className, role: node.getAttribute('role'), text: node.textContent?.slice(0, 80), rect: node.getBoundingClientRect().toJSON(), visibility: getComputedStyle(node).visibility, opacity: getComputedStyle(node).opacity })) });
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  });
}

export async function expectVisibleRoot(page: Page) {
  const state = await page.evaluate(() => {
    const guard = (window as Window & { __visibleRootGuard?: { blankFrames: unknown[]; probe: () => number } }).__visibleRootGuard;
    if (!guard) throw new Error('Missing visible-root monitor');
    return { count: guard.probe(), blankFrames: guard.blankFrames };
  });
  expect(state.count, 'The current screen must contain a visible labelled state').toBeGreaterThan(0);
  expect(state.blankFrames, 'No painted frame may lose all visible labels after UI entry').toEqual([]);
}
