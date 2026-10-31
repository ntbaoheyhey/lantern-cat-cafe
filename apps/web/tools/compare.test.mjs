import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { compare } from '../../../reports/redesign/compare.mjs';

test('comparison matches nested names, keeps missing files and escapes labels/URLs', async () => {
  const root = await mkdtemp(join(tmpdir(), 'cxr0-compare-'));
  try {
    const before = join(root, 'before & old'), after = join(root, 'after'), output = join(root, 'output', 'comparison.html');
    await mkdir(join(before, 'nested'), { recursive: true });
    await mkdir(join(after, 'nested'), { recursive: true });
    // File content is irrelevant to HTML generation; no screenshot/art asset is created in the repository.
    for (const directory of [before, after]) await writeFile(join(directory, 'nested', 'home & hero.png'), 'test');
    await writeFile(join(before, '<missing>.PNG'), 'test');
    await writeFile(join(after, 'new.webp'), 'test');
    await writeFile(join(after, 'ignore.txt'), 'test');
    await symlink(before, join(after, 'outside'));
    const result = await compare(before, after, output);
    assert.equal(result.names, 3);
    assert.equal(result.matched, 1);
    const html = await readFile(output, 'utf8');
    assert.match(html, /&lt;missing&gt;\.PNG/);
    assert.match(html, /before &amp; old/);
    assert.match(html, /before%20%26%20old\/nested\/home%20%26%20hero\.png/);
    assert.equal((html.match(/Missing screenshot/g) ?? []).length, 2);
    assert.doesNotMatch(html, /ignore\.txt|outside\/|<missing>/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('comparison rejects empty or missing input folders', async () => {
  const root = await mkdtemp(join(tmpdir(), 'cxr0-empty-'));
  try {
    await assert.rejects(compare(root, root, join(root, 'empty.html')), /No screenshots/);
    await assert.rejects(compare(join(root, 'missing'), root), /ENOENT/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
