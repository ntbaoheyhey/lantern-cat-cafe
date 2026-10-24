import { expect, it } from 'vitest';
import { layoutKind, stageHeight, stageZoom } from './metrics';

it('picks phone, tablet and desktop layouts at the documented breakpoints', () => {
  expect(layoutKind(320)).toBe('phone');
  expect(layoutKind(600)).toBe('phone');
  expect(layoutKind(601)).toBe('tablet');
  expect(layoutKind(1023)).toBe('tablet');
  expect(layoutKind(1024)).toBe('desktop');
});

it('makes the phone stage 16:9', () => {
  expect(stageHeight(390, 844)).toBe(219);
  expect(stageHeight(320, 568)).toBe(180);
});

it('makes the desktop stage 60% of the viewport height, at least 320 px', () => {
  expect(stageHeight(1280, 800)).toBe(480);
  expect(stageHeight(1280, 720)).toBe(432);
  expect(stageHeight(1280, 400)).toBe(320);
});

it('never makes the stage taller than 60% of its width', () => {
  expect(stageHeight(768, 1400)).toBe(461);
});

it('zooms the 96 px scene by a whole number', () => {
  expect(stageZoom(1280, 480)).toBe(5);
  expect(stageZoom(1280, 432)).toBe(5);
  expect(stageZoom(1280, 320)).toBe(3);
  expect(stageZoom(390, 219)).toBe(2);
  expect(stageZoom(320, 180)).toBe(2);
});

it('keeps at least 160 px of scene width', () => {
  expect(stageZoom(500, 900)).toBe(3);
});
