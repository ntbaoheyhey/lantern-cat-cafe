import {describe,expect,it} from 'vitest';
import type {SyntheticEvent} from 'react';
import {artPropsA6} from './art-a6';
import compact from './home-portrait-manifest-loader.json';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

describe('same-size shell portrait delivery',()=>{
 it('prefers each delivered AVIF and retries the original WebP on decode failure',()=>{
  for(const id of ['mochi','soot','clover','panko']){
   const props=artPropsA6(id),image=document.createElement('img');
   expect(props.src).toMatch(new RegExp(`${id}\\.avif$`));
   image.src=props.src!;
   props.onError({currentTarget:image} as SyntheticEvent<HTMLImageElement>);
   expect(image.src).toMatch(new RegExp(`${id}\\.webp$`));
   expect(image.dataset.artFallback).toBe('original');
   props.onError({currentTarget:image} as SyntheticEvent<HTMLImageElement>);
   expect(image.dataset.artFallback).toBe('classic');
   const final=image.src;
   props.onError({currentTarget:image} as SyntheticEvent<HTMLImageElement>);
   expect(image.src).toBe(final);
  }
 });
 it('retains the dedicated face source and its density candidates',()=>{
  const props=artPropsA6('mochi','face');
  expect(props.src).not.toMatch(/\.avif$/);
  expect(props.srcSet).toContain('2x');
 });
 it('opts small views into384w art and keeps original fallback plus full and face callers',()=>{
  let total=0;
  for(const id of ['mochi','soot','clover','panko'] as const){
   const row=compact[id],props=artPropsA6(id,'art','compact'),image=document.createElement('img');
   const bytes=readFileSync(new URL('../../../../public'+row.src,import.meta.url));total+=bytes.length;
   expect(createHash('sha256').update(bytes).digest('hex')).toBe(row.sha256);expect(row.width).toBe(384);
   expect(props.src).toBe(row.src);expect(artPropsA6(id).src).not.toBe(row.src);
   expect(artPropsA6(id,'face','compact').src).toBe(artPropsA6(id,'face').src);
   image.src=props.src!;props.onError({currentTarget:image}as SyntheticEvent<HTMLImageElement>);
   expect(image.src).toMatch(new RegExp(`${id}\\.webp$`));
   props.onError({currentTarget:image}as SyntheticEvent<HTMLImageElement>);expect(image.dataset.artFallback).toBe('classic');
  }
  expect(total).toBeLessThanOrEqual(110000);
  expect(artPropsA6('brioche','art','compact').src).toBe(artPropsA6('brioche').src);
 });
});
