import Phaser from 'phaser';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ANIM_NAMES, animsFor, CLASS_IDS, CLASS_LOOKS, FRAME, GEAR_RARITIES } from '../game/rig';
import { GEAR_CHOICES, filtersFromQuery, previewGrid, type PreviewFilters } from './previewGrid';
import { PreviewScene, previewColumns, previewSize, type PreviewData } from './PreviewScene';
import './spritePreview.css';

const ZOOMS = [2, 3, 4] as const;

/** Dev-only sprite preview: every class x armor set x rarity x animation, with play, pause and step. */
export function SpritePreview() {
  const host = useRef<HTMLDivElement>(null);
  const game = useRef<Phaser.Game | null>(null);
  // Initial state can come from the URL, e.g. /?dev=sprites&cls=rogue&anim=attack&strip=1&zoom=4.
  const query = useMemo(() => new URLSearchParams(window.location.search), []);
  const [filters, setFilters] = useState<PreviewFilters>(() => filtersFromQuery(query));
  const [zoom, setZoom] = useState<number>(() => (ZOOMS as readonly number[]).find((z) => String(z) === query.get('zoom')) ?? 3);
  const [anchors, setAnchors] = useState(query.get('anchors') === '1');
  const [light, setLight] = useState(query.get('light') === '1');
  const [strip, setStrip] = useState(query.get('strip') === '1');
  const [playing, setPlaying] = useState(true);
  const grid = useMemo(() => previewGrid(filters), [filters]);
  const data: PreviewData = useMemo(
    () => ({ rows: grid.rows, anims: grid.anims, zoom, anchors, light, strip }),
    [grid, zoom, anchors, light, strip],
  );

  useEffect(() => {
    const parent = host.current;
    if (!parent) return;
    // Strip mode: as many columns as the longest row needs (the Rogue attack has 8 frames).
    const columns = Math.max(1, ...data.rows.map((row) => previewColumns(data, (a) => animsFor(CLASS_LOOKS[row.cls].weaponType)[a].frames.length).length));
    const size = previewSize(data, columns, FRAME.w, FRAME.h);
    if (!game.current) {
      game.current = new Phaser.Game({
        type: Phaser.CANVAS, parent, ...size, pixelArt: true, banner: false, audio: { noAudio: true },
        scene: [],
      });
      game.current.scene.add('preview', PreviewScene, true, data);
    } else {
      game.current.scale.resize(size.width, size.height);
      game.current.scene.getScene('preview')?.scene.restart(data);
    }
    setPlaying(true);
  }, [data]);

  useEffect(() => () => {
    game.current?.destroy(true);
    game.current = null;
  }, []);

  const scene = () => game.current?.scene.getScene('preview') as PreviewScene | undefined;
  const set = <K extends keyof PreviewFilters>(k: K) => (e: React.ChangeEvent<HTMLSelectElement>) =>
    setFilters((f) => ({ ...f, [k]: e.target.value }));

  return (
    <main className="sprite-preview">
      <header>
        <h1>Sprite preview</h1>
        <p>
          Cat rig v2 placeholder art. {grid.rows.length} looks × {grid.anims.length} animations. Turn on anchors to
          check that gear sits on the head, body, paws, feet and grip in every frame.
        </p>
      </header>
      <form className="sprite-controls" onSubmit={(e) => e.preventDefault()}>
        <label>Class
          <select value={filters.cls} onChange={set('cls')}>
            <option value="all">All</option>
            {CLASS_IDS.map((c) => <option key={c} value={c}>{CLASS_LOOKS[c].name}</option>)}
          </select>
        </label>
        <label>Armor set
          <select value={filters.gear} onChange={set('gear')}>
            <option value="all">All</option>
            {GEAR_CHOICES.map((g) => <option key={g} value={g}>{g === 'none' ? 'No armor' : g}</option>)}
          </select>
        </label>
        <label>Rarity
          <select value={filters.rarity} onChange={set('rarity')}>
            <option value="all">All</option>
            {GEAR_RARITIES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
        <label>Animation
          <select value={filters.anim} onChange={set('anim')}>
            <option value="all">All</option>
            {ANIM_NAMES.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </label>
        <label>Zoom
          <select value={zoom} onChange={(e) => setZoom(Number(e.target.value))}>
            {ZOOMS.map((z) => <option key={z} value={z}>{z}x</option>)}
          </select>
        </label>
        <button type="button" onClick={() => { scene()?.setPlaying(!playing); setPlaying(!playing); }}>
          {playing ? 'Pause' : 'Play'}
        </button>
        <button type="button" disabled={playing || strip} onClick={() => scene()?.step()}>Step frame</button>
        <label className="check"><input type="checkbox" checked={anchors} onChange={(e) => setAnchors(e.target.checked)} /> Anchors</label>
        <label className="check"><input type="checkbox" checked={strip} onChange={(e) => setStrip(e.target.checked)} /> All frames</label>
        <label className="check"><input type="checkbox" checked={light} onChange={(e) => setLight(e.target.checked)} /> Light background</label>
      </form>
      <div className="sprite-stage" ref={host} data-testid="sprite-stage" />
    </main>
  );
}
