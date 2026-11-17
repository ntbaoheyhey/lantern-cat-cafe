import {describe,expect,it} from 'vitest';
import type {SyntheticEvent} from 'react';
import {artPropsA6} from './art-a6';

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
});
