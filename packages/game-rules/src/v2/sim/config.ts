import { V2_CONFIG, type V2Config as LiteralConfig } from '../config';

// The production config uses `as const`; widen leaves so proposals can express new numbers.
type Widen<T> = T extends number ? number : T extends string ? string : T extends boolean ? boolean : { -readonly [K in keyof T]: Widen<T[K]> };
type V2Config = Widen<LiteralConfig>;
export type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };
export type ConfigOverridesV2 = DeepPartial<V2Config>;
/** No V2_CONFIG leaves are captured. These content-derived values are outside V2_CONFIG. */
export const NOT_OVERRIDABLE_V2 = ['MATERIALS.*.maxStack (STACK_CAPS_V2 and CAT_KEY_CAP)', 'CHEST_SCALING.* (CHESTS)', 'content registries (combat/bag/idle lookup maps)'] as const;
let active = false;
export function withConfigV2<T>(overrides: ConfigOverridesV2, fn: () => T): T {
  if (active) throw new Error('nested config overrides are not supported');
  const edits: { target: Record<string, unknown>; key: string; before: unknown; after: unknown }[] = [];
  const visit = (target: Record<string, unknown>, source: object, prefix = '') => {
    for (const [key, after] of Object.entries(source)) {
      const path = prefix ? `${prefix}.${key}` : key;
      // Array length is structural: assigning it can delete entries that a leaf restore cannot recover.
      if (!Object.prototype.propertyIsEnumerable.call(target, key)) throw new Error(`unknown config path: ${path}`);
      const before = target[key];
      if (before !== null && typeof before === 'object') {
        if (after === null || typeof after !== 'object') throw new Error(`invalid config value: ${path}`);
        visit(before as Record<string, unknown>, after, path);
      } else {
        if (typeof after !== typeof before || (typeof after === 'number' && !Number.isFinite(after))) throw new Error(`invalid config value: ${path}`);
        edits.push({ target, key, before, after });
      }
    }
  };
  visit(V2_CONFIG as unknown as Record<string, unknown>, overrides);
  active = true;
  try {
    for (const edit of edits) edit.target[edit.key] = edit.after;
    return fn();
  } finally {
    for (const edit of edits.reverse()) edit.target[edit.key] = edit.before;
    active = false;
  }
}
