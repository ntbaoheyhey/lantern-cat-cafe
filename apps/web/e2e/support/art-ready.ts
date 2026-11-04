import { expect, type Page } from '@playwright/test';

/** Decode the actual visible paint, inspect its clipped pixels, then allow two paints. */
export async function expectArtPaint(page: Page, selector = '[data-original-art], [data-art2]') {
  await page.evaluate(() => document.fonts.ready);
  const paints = await page.locator(selector).evaluateAll(async nodes => {
    const result: { id: string; colors: number; opaque: number; width: number; height: number }[] = [];
    for (const node of nodes) {
      const box = node.getBoundingClientRect();
      if (!box.width || !box.height || box.bottom <= 0 || box.top >= innerHeight) continue;
      const style = getComputedStyle(node);
      const isImage = node instanceof HTMLImageElement;
      const url = isImage ? node.currentSrc || node.src : style.backgroundImage.match(/url\(["']?(.*?)["']?\)/)?.[1];
      if (!url) throw new Error('Missing art source: ' + node.outerHTML.slice(0, 120));
      const image = new Image(); image.src = url; await image.decode();
      if (isImage) await node.decode();
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(box.width); canvas.height = Math.round(box.height);
      const context = canvas.getContext('2d'); if (!context) throw new Error('Canvas unavailable');
      context.imageSmoothingEnabled = false;
      if (isImage) context.drawImage(image, 0, 0, canvas.width, canvas.height);
      else {
        const [w, h] = style.backgroundSize.split(' ').map(Number.parseFloat);
        const [x, y] = style.backgroundPosition.split(' ').map(Number.parseFloat);
        if (![w, h, x, y].every(value => Number.isFinite(value))) throw new Error('Unresolved atlas geometry');
        context.drawImage(image, x!, y!, w!, h!);
      }
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      const colors = new Set<string>(); let opaque = 0;
      for (let i = 0; i < pixels.length; i += 4) if (pixels[i + 3]) {
        opaque++; colors.add(`${pixels[i]},${pixels[i + 1]},${pixels[i + 2]}`);
      }
      result.push({ id: node.getAttribute('data-original-art') || node.getAttribute('data-art2') || '', colors: colors.size, opaque, width: image.naturalWidth, height: image.naturalHeight });
    }
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    return result;
  });
  expect(paints.length, 'At least one visible art paint must be inspected').toBeGreaterThan(0);
  for (const paint of paints) {
    expect(paint.opaque, `${paint.id} decoded but has no visible pixels`).toBeGreaterThan(20);
    expect(paint.colors, `${paint.id} is blank or monochrome`).toBeGreaterThanOrEqual(3);
  }
  return paints;
}
