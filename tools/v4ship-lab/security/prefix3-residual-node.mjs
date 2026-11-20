/** Parse historical code and derive public test accounts without emitting values. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { resolve, relative } from 'node:path';
const root = resolve(import.meta.dirname, '../../..');
const require = createRequire(resolve(root, 'apps/web/package.json'));
const ts = require('typescript');
const hash = b => createHash('sha256').update(b).digest('hex');
const sign = path => ({ path: relative(root, path), sha256: hash(readFileSync(path)) });

function contract(request) {
  const data = execFileSync('git', ['show', request.mapping.commit + ':' + request.mapping.path], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
  const text = data.toString('utf8');
  const source = ts.createSourceFile(request.mapping.path, text, ts.ScriptTarget.Latest, true);
  assert.equal(ts.version, '5.9.3'); assert.equal(source.parseDiagnostics.length, 0);
  const nodes = []; const walk = n => { nodes.push(n); ts.forEachChild(n, walk); }; walk(source);
  const byte = n => Buffer.byteLength(text.slice(0, n));
  const printer = ts.createPrinter({ removeComments: true });
  const normalized = n => printer.printNode(ts.EmitHint.Unspecified, n, source).replace(/\s/g, '');
  const expression = code => ts.createSourceFile('expected.ts', code, ts.ScriptTarget.Latest, true).statements[0].expression;
  const same = (node, code) => normalized(node) === normalized(expression(code));
  const check = capture => {
    if (!capture.ExactBytes) return false;
    const selected = nodes.filter(n => ts.isStringLiteral(n) && byte(n.getStart(source) + 1) === capture.ScalarStart && byte(n.end - 1) === capture.ScalarEnd);
    if (selected.length !== 1) return false;
    const literal = selected[0], array = literal.parent;
    if (!ts.isArrayLiteralExpression(array) || !array.elements.every(ts.isStringLiteral)) return false;
    const assertion = array.parent;
    if (!ts.isAsExpression(assertion) || assertion.type.getText(source) !== 'const') return false;
    let receiver = assertion.parent;
    if (!ts.isParenthesizedExpression(receiver)) return false;
    const access = receiver.parent, call = access.parent;
    if (!ts.isPropertyAccessExpression(access) || access.name.text !== 'flatMap' || !ts.isCallExpression(call) || call.expression !== access || call.arguments.length !== 1) return false;
    const callback = call.arguments[0];
    if (!ts.isArrowFunction(callback) || callback.parameters.length !== 1 || callback.parameters[0].name.getText(source) !== 'key' || !ts.isBlock(callback.body)) return false;
    const [declaration, returned] = callback.body.statements;
    if (callback.body.statements.length !== 2 || !ts.isVariableStatement(declaration) || !ts.isReturnStatement(returned)) return false;
    const variables = declaration.declarationList.declarations;
    if (variables.length !== 1 || variables[0].name.getText(source) !== 'value' || !same(variables[0].initializer, 'd?.[key] && asAddress(d[key]!)') || !same(returned.expression, 'value ? [[key, value]] : []')) return false;
    let fn = call.parent; while (fn && !ts.isFunctionDeclaration(fn)) fn = fn.parent;
    if (!fn || fn.name?.text !== 'getAddresses' || fn.type?.getText(source) !== 'Addresses') return false;
    const local = fn.body.statements[0];
    if (!ts.isVariableStatement(local) || local.declarationList.declarations.length !== 1) return false;
    const d = local.declarationList.declarations[0];
    if (d.name.getText(source) !== 'd' || !same(d.initializer, 'deployments[chainId]')) return false;
    const interfaces = source.statements.filter(n => ts.isInterfaceDeclaration(n) && n.name.text === 'Addresses');
    if (interfaces.length !== 1 || !interfaces[0].members.some(n => ts.isPropertySignature(n) && n.name.getText(source) === literal.text && n.type?.getText(source) === 'Address')) return false;
    const deployment = source.statements.filter(ts.isVariableStatement).flatMap(n => [...n.declarationList.declarations]).find(n => n.name.getText(source) === 'deployments');
    const types = []; const visitType = n => { if (ts.isLiteralTypeNode(n) && ts.isStringLiteral(n.literal)) types.push(n.literal.text); ts.forEachChild(n, visitType); }; visitType(deployment.type);
    return types.includes(literal.text);
  };
  assert(check(request.capture));
  assert(!check({ ...request.capture, ScalarStart: request.capture.ScalarStart + 1 }));
  return { pass: true, compilerVersion: ts.version, compiler: sign(require.resolve('typescript')), exactArrayLiteral: true, constantAssertion: true, callbackPropertyLookup: true, addressInterfaceProperty: true, deploymentTypeMember: true, controls: ['shifted-contract-position'] };
}

function fixture(request) {
  const { mnemonicToAccount } = require('viem/accounts');
  const derived = index => Buffer.from(mnemonicToAccount(request.mnemonic, { addressIndex: index }).getHdKey().privateKey);
  const candidate = Buffer.from(request.candidate.slice(2), 'hex');
  assert.equal(candidate.length, 32); assert(derived(0).equals(candidate)); assert(!derived(1).equals(candidate));
  const viemRequire = createRequire(require.resolve('viem/accounts'));
  return { pass: true, method: 'viem mnemonicToAccount / scure BIP32', accountIndex: 0, derivationPath: "m/44'/60'/0'/0/0", adjacentAccountRejected: true, dependencies: ['viem/accounts', '@scure/bip32', '@scure/bip39'].map(name => sign(name === 'viem/accounts' ? require.resolve(name) : viemRequire.resolve(name))) };
}

try {
  const request = JSON.parse(readFileSync(0, 'utf8'));
  process.stdout.write(JSON.stringify(request.kind === 'fixture' ? fixture(request) : contract(request)) + '\n');
} catch {
  process.stderr.write('Prefix3 node semantics failed; values suppressed\n'); process.exitCode = 1;
}
