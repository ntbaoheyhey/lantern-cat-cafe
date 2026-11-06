// Pure CPU preflight for unintegrated original art. Does not claim rendered quality or timing.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { requireWeb, web } from '../visual-support.mjs';
const { createServer } = await import(requireWeb.resolve('vite'));
const server = await createServer({ configFile: false, root: web, envDir: false, server: { middlewareMode: true, hmr: false, ws: false, watch: null }, appType: 'custom' });
const output = process.env.BIG_DRAFT_OUT || 'reports/cardrpg-big2/cats/draft-art';
const sources = {}, geometries = [], props = [], errors = [], recipes = [];
try {
  const base = await server.ssrLoadModule('/src/game/squad/turn3d/card-effect-data.ts');
  recipes.push(...Object.entries(base.CARD_EFFECT_RECIPES));
  for (const batch of [2, 3]) {
    const prefix = `/tmp/cardrpg-big2-batch${batch}-source/card-roster-batch${batch}`;
    for (const kind of ['effects', 'primitives', 'props']) {
      const path = `${prefix}-${kind}.ts`, module = await server.ssrLoadModule('/@fs' + path);
      sources[path] = createHash('sha256').update(await readFile(path)).digest('hex');
      if (kind === 'effects') recipes.push(...Object.entries(module[`BATCH${batch}_EFFECT_RECIPES`]));
      if (kind === 'primitives') for (const name of module[`BATCH${batch}_PRIMITIVES`]) {
        const g = module[`createBatch${batch}Primitive`](name);
        if (![...g.attributes.position.array].every(Number.isFinite) || !g.boundingSphere.radius) errors.push(`Invalid primitive ${name}`);
        geometries.push({ name, vertices: g.attributes.position.count, triangles: g.attributes.position.count / 3, radius: g.boundingSphere.radius }); g.dispose();
      }
      if (kind === 'props') for (const name of batch === 2 ? ['biscuit', 'inkcap', 'cinnamon'] : ['brioche', 'velvet', 'marigold']) {
        const prop = module[`batch${batch}Prop`](name);
        for (const group of prop.parts) for (const g of group) {
          if (![...g.attributes.position.array].every(Number.isFinite)) errors.push(`Invalid prop ${name}`); g.dispose();
        }
        props.push({ name, materials: prop.parts.length, geometryParts: prop.parts.map(g => g.length), hand: prop.hand });
      }
    }
  }
  const signatures = new Map();
  const known = new Set([...(await server.ssrLoadModule('/src/game/squad/turn3d/card-effect-primitives.ts')).CARD_EFFECT_PRIMITIVES, ...geometries.map(g => g.name)]);
  for (const [id, recipe] of recipes) {
    const signature = base.cardEffectSignature(recipe);
    if (signatures.has(signature)) errors.push(`Duplicate composition ${id}/${signatures.get(signature)}`);
    signatures.set(signature, id);
    for (const layer of recipe.layers) if (!known.has(layer.primitive) || layer.start < 0 || layer.start >= layer.end || layer.end > 1) errors.push(`Invalid layer ${id}/${layer.primitive}`);
    for (let frame = 0; frame <= 100; frame++) {
      const active = recipe.layers.filter(l => frame / 100 >= l.start && frame / 100 <= l.end);
      const instances = active.reduce((sum, l) => sum + l.count * (l.anchor === 'all-targets' ? 3 : 1), 0);
      if (instances > 96 || new Set(active.map(l => l.primitive)).size > 8) errors.push(`Budget ${id}/${frame}`);
    }
  }
} finally { await server.close(); }
await mkdir(output, { recursive: true });
await writeFile(`${output}/preflight.json`, JSON.stringify({ sources, method: 'Finite procedural geometry and structural layer budgets; no browser, visual or timing claims', geometries, props, compositions: recipes.length, errors }, null, 2));
console.log(JSON.stringify({ primitives: geometries.length, props: props.length, compositions: recipes.length, errors }));
if (errors.length) process.exitCode = 1;
