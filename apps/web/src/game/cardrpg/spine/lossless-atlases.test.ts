import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {expect,it} from 'vitest';
import pages from './lossless-atlases.json';

// An updated source atlas must never silently keep serving an older derivative.
const root=resolve(process.cwd(),'../..')+'/';
const hash=(path:string)=>createHash('sha256').update(readFileSync(root+path)).digest('hex');
it.each(pages)('keeps the exact lossless derivative current for $request',page=>{
 expect(hash(page.source)).toBe(page.sourceSha256);
 expect(hash('apps/web/public'+page.url)).toBe(page.sha256);
 expect(page.url).toContain(page.sourceSha256.slice(0,12));
});
