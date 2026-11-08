/** Build-only transform; source catalog and pixels remain unchanged. */
export function pixelPackingPlugin(): {
  name: string;
  enforce: 'pre';
  apply: 'build';
  transform(source: string, id: string): { code: string; map: null } | undefined;
};
