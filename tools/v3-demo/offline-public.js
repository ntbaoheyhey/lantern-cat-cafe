// Runs inside the existing offline loader after every original byte is restored.
// Resolve public URLs to their packed Blob counterparts without changing game sources.
const publicUrl = value => {
  if (typeof value !== 'string') return value;
  let pathname;
  try { pathname = new URL(value, location.href).pathname; } catch { return value; }
  return assets['public' + pathname] ?? value;
};
const publicCss = value => typeof value === 'string'
  ? value.replace(/url\(\s*(['"]?)([^)'"\s]+)\1\s*\)/g, (_, quote, url) => `url("${publicUrl(url)}")`)
  : value;
window.__demoOffline = {networkAttempts: [], missingAssets: []};
const nativeFetch = window.fetch.bind(window);
window.fetch = (input, init) => {
  const original = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  const url = publicUrl(original);
  if (/^(blob:|data:)/.test(url)) return nativeFetch(url, init);
  window.__demoOffline.networkAttempts.push(original);
  if (/^\/(audio|art|units|cinematics)\//.test(original)) window.__demoOffline.missingAssets.push(original);
  return Promise.reject(new TypeError('Saved demo: network and chain services are offline.'));
};
for (const [prototype, names] of [
  [HTMLImageElement.prototype, ['src']], [HTMLMediaElement.prototype, ['src']],
  [HTMLSourceElement.prototype, ['src']], [HTMLVideoElement.prototype, ['poster']],
]) for (const name of names) {
  const descriptor = Object.getOwnPropertyDescriptor(prototype, name);
  if (descriptor?.set) Object.defineProperty(prototype, name, {...descriptor, set(value) { descriptor.set.call(this, publicUrl(value)); }});
}
const nativeAttribute = Element.prototype.setAttribute;
Element.prototype.setAttribute = function(name, value) {
  return nativeAttribute.call(this, name, ['src', 'poster'].includes(name.toLowerCase()) ? publicUrl(value) : name === 'style' ? publicCss(value) : value);
};
const nativeProperty = CSSStyleDeclaration.prototype.setProperty;
CSSStyleDeclaration.prototype.setProperty = function(name, value, priority) {
  return nativeProperty.call(this, name, publicCss(value), priority);
};
for (const name of ['background', 'backgroundImage', 'borderImage', 'borderImageSource', 'maskImage', 'webkitMaskImage', 'cssText']) {
  const descriptor = Object.getOwnPropertyDescriptor(CSSStyleDeclaration.prototype, name);
  if (descriptor?.set) Object.defineProperty(CSSStyleDeclaration.prototype, name, {...descriptor, set(value) { descriptor.set.call(this, publicCss(value)); }});
}
