import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
const root = process.argv[2];
const ts = createRequire(root + '/packages/game-rules/package.json')('typescript');
const source = ts.createSourceFile('config.ts', readFileSync(root + '/packages/game-rules/src/config.ts', 'utf8'), ts.ScriptTarget.Latest, true);
let config;
function visit(node) {
  if (ts.isVariableDeclaration(node) && node.name.getText(source) === 'CONFIG') config = node.initializer;
  ts.forEachChild(node, visit);
}
visit(source);
const unwrap = node => ts.isAsExpression(node) ? unwrap(node.expression) : node;
const member = (node, name) => {
  node = unwrap(node); assert.ok(ts.isObjectLiteralExpression(node));
  const field = node.properties.find(p => p.name?.getText(source).replace(/^['"]|['"]$/g, '') === name);
  assert.ok(field && ts.isPropertyAssignment(field), name); return unwrap(field.initializer);
};
const count = node => { assert.ok(ts.isObjectLiteralExpression(node)); return node.properties.length; };
const original = member(config, 'originalEconomy');
const flag = member(member(config, 'features'), 'originalEconomy');
assert.equal(flag.kind, ts.SyntaxKind.FalseKeyword);
const facts = { originalEconomyDefault: false, stats: count(member(original, 'stats')), items: count(member(member(original, 'gear'), 'items')), qualities: count(member(member(original, 'gear'), 'qualities')), skills: count(member(member(original, 'skills'), 'entries')), icons: readdirSync(root + '/apps/web/src/art/generated/original/icons').filter(n => n.endsWith('.png')).length };
assert.deepEqual(facts, { originalEconomyDefault: false, stats: 12, items: 15, qualities: 5, skills: 7, icons: 34 });
console.log(JSON.stringify(facts));
