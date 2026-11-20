import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {expect,it} from 'vitest';
import actors from './sampled-atlases.json';
import effects from '../vfx-layered/sampled-atlases.json';

const root=resolve(process.cwd(),'../..');
const hash=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
// A designer replacement must invalidate its sampled derivative, as for exact delivery.
it.each([...actors,...effects])('binds the sampled page to current source art: $request',page=>{
 expect(hash(readFileSync(resolve(root,page.source)))).toBe(page.sourceSha256);
 const delivered=readFileSync(resolve(root,'apps/web/public'+page.url));
 expect(hash(delivered)).toBe(page.sha256);expect(delivered.length).toBe(page.bytes);
 expect(page.exactSourcePixels).toBe(false);
});
