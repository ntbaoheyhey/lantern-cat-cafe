/** Conservative computed-style contrast audit, including gradient stops and alpha layers. */
export async function auditContrast(page) {
  return page.evaluate(() => {
    const failures = [], unresolved = [];
    let checked = 0, minimum = Infinity;
    const parse = color => {
      const channels = color.match(/[\d.]+/g)?.map(Number);
      return channels?.length >= 3 ? [...channels.slice(0, 3), channels[3] ?? 1] : null;
    };
    const blend = (front, back) => front.slice(0, 3).map((channel, index) => channel * front[3] + back[index] * (1 - front[3]));
    const luminance = color => {
      const values = color.slice(0, 3).map(channel => {
        const value = channel / 255;
        return value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4;
      });
      return values[0] * .2126 + values[1] * .7152 + values[2] * .0722;
    };
    const contrast = (front, back) => {
      const a = luminance(front), b = luminance(back);
      return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
    };
    for (const element of document.querySelectorAll('.dp-app *')) {
      if (element.closest('[inert],:disabled') || !element.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) continue;
      const text = [...element.childNodes].filter(node => node.nodeType === Node.TEXT_NODE).map(node => node.textContent).join('').trim();
      if (!text || ['OPTION', 'STYLE', 'SCRIPT'].includes(element.tagName)) continue;
      const style = getComputedStyle(element), foreground = parse(style.color);
      const layers = [];
      let opacity = 1, complex = false;
      for (let parent = element; parent; parent = parent.parentElement) {
        const css = getComputedStyle(parent);
        opacity *= Number(css.opacity);
        const fill = parse(css.backgroundColor);
        const gradients = (css.backgroundImage.match(/rgba?\([^)]*\)/g) ?? []).map(parse);
        if (css.backgroundImage.includes('url(')) complex = true;
        layers.unshift({ fill, gradients });
      }
      if (!foreground || complex) { unresolved.push(text.slice(0, 80)); continue; }
      let backgrounds = [[29, 27, 40]];
      for (const { fill, gradients } of layers) {
        if (fill) backgrounds = backgrounds.map(background => blend(fill, background));
        if (gradients.length) backgrounds = backgrounds.flatMap(background => gradients.map(stop => blend(stop, background)));
      }
      foreground[3] *= opacity;
      const ratio = Math.min(...backgrounds.map(background => contrast(blend(foreground, background), background)));
      const large = parseFloat(style.fontSize) >= 24 || (parseFloat(style.fontSize) >= 18.66 && Number(style.fontWeight) >= 700);
      const threshold = large ? 3 : 4.5;
      checked++;
      minimum = Math.min(minimum, ratio);
      if (ratio + .01 < threshold) failures.push({ text: text.slice(0, 100), ratio, threshold, class: element.className });
    }
    return { checked, minimum, failures, unresolved };
  });
}
