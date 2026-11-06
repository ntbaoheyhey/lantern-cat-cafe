interface CropMeasurement {
  phase: string;
  crop: string;
  laplacianVariance: number;
  changePercent?: number;
}
const crops = import.meta.glob('../../../../../../assets/cardrpg3/evidence/*.webp', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const measurements = import.meta.glob('../../../../../../assets/cardrpg3/evidence/metrics.json', { eager: true, import: 'default' }) as Record<string, { rows: CropMeasurement[] }>;
const rows = Object.values(measurements)[0]?.rows ?? [];
const labels: Record<string, string> = { 'hero-face': 'Mochi face', enemy: 'Enemy face', 'hud-text': 'HUD text', portrait: 'Portrait', 'skill-icon': 'Skill icon' };

export function SharpnessEvidence() {
  if (!rows.length) return null;
  return <section className="cr-panel dp-sharpness"><h2>Image clarity</h2>
    <p>Native-pixel crops at each display density. Laplacian variance measures edge contrast and also responds to composition and lighting.</p>
    {[1, 2].map(dpr => <details key={dpr} open={dpr === 1}><summary>DPR {dpr}</summary>
      <div className="dp-crop-grid">{rows.filter(row => row.phase === 'current' && row.crop.startsWith(`dpr${dpr}-`)).map(row => {
        const before = rows.find(candidate => candidate.phase === 'baseline' && candidate.crop === row.crop)!;
        const label = labels[row.crop.replace(/^dpr\d-/, '')] ?? row.crop;
        return <article key={row.crop}><h3>{label}</h3><div className="dp-crop-pair">
          {['baseline', 'current'].map(phase => <figure key={phase}><img
            src={crops[`../../../../../../assets/cardrpg3/evidence/${phase}-${row.crop}.webp`]}
            alt={`${label}, ${phase === 'baseline' ? 'baseline' : 'current'}, DPR ${dpr}`} />
            <figcaption>{phase === 'baseline' ? 'Baseline' : 'Current'}</figcaption></figure>)}
        </div><p>{before.laplacianVariance.toFixed(1)} → {row.laplacianVariance.toFixed(1)} · {row.changePercent!.toFixed(1)}%</p></article>;
      })}</div>
    </details>)}
    <p className="dp-reference">REFERENCE — reports/cardrpg-big/sharpness.json · tools/cardrpg-big/inspect.mjs · tools/cardrpg-big/sharpness.py</p>
  </section>;
}
