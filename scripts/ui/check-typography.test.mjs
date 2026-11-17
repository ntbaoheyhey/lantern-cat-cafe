import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve,dirname} from 'node:path';
import {fontFamilyViolations,checkTypography} from './check-typography.mjs';

test('token consumers preserve centralized faces without accepting arbitrary families',()=>{
 assert.deepEqual(fontFamilyViolations('.a{font-family:var(--font-body,sans-serif)} .b{font-family: var(--font-num) !important;}'),[]);
 for(const family of ['Arial','var(--font-unknown)','var(--FONT-body)','var(--font-body,Comic Sans)','var(--font-body),Arial','inherit']){
  assert.deepEqual(fontFamilyViolations(`.a{font-family:${family}}`),[family]);
 }
 assert.deepEqual(fontFamilyViolations('/* font-family:Arial */ .a{font-family:var(--font-display)}'),[]);
});

test('a file named typography does not bypass central placement or the font payload limit',()=>{
 const root=mkdtempSync(resolve(tmpdir(),'v4-typography-'));
 const put=(path,value)=>{const target=resolve(root,path);mkdirSync(dirname(target),{recursive:true});writeFileSync(target,value);};
 try{
  put('apps/web/src/ui/typography.css','@font-face{font-family:"Approved face";}');
  put('apps/web/src/feature/typography.css','.a{font-family:"Unapproved face";}');
  put('apps/web/public/fonts/sample.woff2',Buffer.alloc(400*1024+1));
  assert.deepEqual(checkTypography(root).errors,['apps/web/src/feature/typography.css','Font payload exceeds 400 KB']);
 }finally{rmSync(root,{recursive:true,force:true});}
});
