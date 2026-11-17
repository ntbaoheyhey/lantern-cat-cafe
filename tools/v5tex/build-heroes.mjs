#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const vfxDir = '/Users/bao/th-v5-ag2/apps/web/public/vfx/v5';
const workBase = '/Users/bao/th-v5-ag2/work/v5/AG2/jobs/heroes';

if (!fs.existsSync(vfxDir)) fs.mkdirSync(vfxDir, { recursive: true });
if (!fs.existsSync(workBase)) fs.mkdirSync(workBase, { recursive: true });

function run(cmd) {
  execSync(cmd, { stdio: 'pipe' });
}

function toWebP(pngIn, webpOut, q = 82) {
  run(`cwebp -q ${q} -alpha_q 90 "${pngIn}" -o "${webpOut}"`);
}

// ----------------------------------------------------------------------
// HERO CONFIGS
// ----------------------------------------------------------------------
const HEROES = {
  mochi: {
    primary: 'rgba(255, 82, 136, 1.0)',       // strawberry pink
    primaryFade: (a) => `rgba(255, 82, 136, ${a})`,
    secondary: 'rgba(255, 240, 208, 1.0)',    // warm cream
    secondaryFade: (a) => `rgba(255, 240, 208, ${a})`,
    accent: 'rgba(255, 180, 205, 1.0)',
    theme: 'pink ribbons, soft fabric paw, cream sparkle',
    slashType: 'flipbook',
  },
  soot: {
    primary: 'rgba(255, 110, 32, 1.0)',      // ember orange
    primaryFade: (a) => `rgba(255, 110, 32, ${a})`,
    secondary: 'rgba(255, 210, 60, 1.0)',     // bright spark yellow
    secondaryFade: (a) => `rgba(255, 210, 60, ${a})`,
    accent: 'rgba(80, 75, 75, 1.0)',          // charcoal
    theme: 'charcoal soot, firecracker ember sparks',
    slashType: 'projectile',
  },
  clover: {
    primary: 'rgba(56, 183, 100, 1.0)',       // leaf green
    primaryFade: (a) => `rgba(56, 183, 100, ${a})`,
    secondary: 'rgba(244, 208, 63, 1.0)',     // soft gold
    secondaryFade: (a) => `rgba(244, 208, 63, ${a})`,
    accent: 'rgba(168, 230, 150, 1.0)',
    theme: 'emerald clover petals, golden pollen, healing stitches',
    slashType: 'projectile',
  },
  panko: {
    primary: 'rgba(254, 215, 76, 1.0)',       // butter yellow
    primaryFade: (a) => `rgba(254, 215, 76, ${a})`,
    secondary: 'rgba(180, 115, 50, 1.0)',     // toasted brown
    secondaryFade: (a) => `rgba(180, 115, 50, ${a})`,
    accent: 'rgba(255, 245, 180, 1.0)',
    theme: 'toasted crust, butter crumbs, crumb slam shockwave',
    slashType: 'flipbook',
  },
};

console.log('Building V5 Hero VFX textures...');

// ----------------------------------------------------------------------
// 1. ANTICIPATION GLOW (256x256 single)
// ----------------------------------------------------------------------
function buildAnticipation(heroKey) {
  const h = HEROES[heroKey];
  const outPng = path.join(workBase, `${heroKey}_anticipation.png`);
  const outWebp = path.join(vfxDir, `${heroKey}-anticipation.webp`);

  const draws = [];
  // Center radial glow layers
  draws.push(`fill "${h.secondaryFade(0.9)}" circle 128,128 128,150`);
  draws.push(`fill "${h.primaryFade(0.7)}" circle 128,128 128,180`);
  draws.push(`fill "${h.primaryFade(0.35)}" circle 128,128 128,215`);

  // Decorative hero motif rings
  if (heroKey === 'mochi') {
    // 4 cross-stitch tick marks
    draws.push(`stroke "${h.primaryFade(0.8)}" stroke-width 3 line 128,30 128,55 line 128,201 128,226 line 30,128 55,128 line 201,128 226,128`);
    draws.push(`stroke "${h.secondaryFade(0.9)}" stroke-width 2 circle 128,128 128,195`);
  } else if (heroKey === 'soot') {
    // Ember sparks spinning around vortex
    for (let deg = 0; deg < 360; deg += 45) {
      const rad = (deg * Math.PI) / 180;
      const r = 75;
      const sx = 128 + Math.cos(rad) * r;
      const sy = 128 + Math.sin(rad) * r;
      draws.push(`fill "${h.secondaryFade(0.9)}" circle ${sx.toFixed(1)},${sy.toFixed(1)} ${(sx + 3).toFixed(1)},${sy.toFixed(1)}`);
    }
  } else if (heroKey === 'clover') {
    // 4 petal lobes radiating
    draws.push(`stroke "${h.secondaryFade(0.85)}" stroke-width 2.5 circle 128,128 128,190`);
    for (let deg = 45; deg < 360; deg += 90) {
      const rad = (deg * Math.PI) / 180;
      const sx = 128 + Math.cos(rad) * 60;
      const sy = 128 + Math.sin(rad) * 60;
      draws.push(`fill "${h.primaryFade(0.6)}" circle ${sx.toFixed(1)},${sy.toFixed(1)} ${(sx + 15).toFixed(1)},${sy.toFixed(1)}`);
    }
  } else if (heroKey === 'panko') {
    // Stitched bread crust brackets
    draws.push(`stroke "${h.secondaryFade(0.9)}" stroke-width 3.5 fill none rectangle 60,60 196,196`);
    draws.push(`stroke "${h.primaryFade(0.7)}" stroke-width 2 fill none circle 128,128 128,200`);
  }

  run(`magick -size 256x256 xc:black -draw '${draws.join(' ')}' -blur 0x1.5 "${outPng}"`);
  toWebP(outPng, outWebp);
  console.log(`  -> ${outWebp}`);
}

// ----------------------------------------------------------------------
// 2. IMPACT FLIPBOOK (4x4 = 512x512 atlas, 16 frames of 128x128)
// ----------------------------------------------------------------------
function buildImpactFlipbook(heroKey) {
  const h = HEROES[heroKey];
  const heroWork = path.join(workBase, `impact_${heroKey}`);
  if (fs.existsSync(heroWork)) fs.rmSync(heroWork, { recursive: true });
  fs.mkdirSync(heroWork, { recursive: true });

  const N = 16;
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const framePng = path.join(heroWork, `f_${String(i).padStart(2, '0')}.png`);
    const C = 64; // center of 128x128 frame
    const draws = [];

    // Core expansion & flash
    const coreR = Math.max(1, 24 * Math.sin(Math.min(Math.PI, t * Math.PI * 1.5)));
    const coreAlpha = Math.max(0, 1 - t * 2.5);
    if (coreAlpha > 0.05) {
      draws.push(`fill "${h.secondaryFade(coreAlpha.toFixed(2))}" circle ${C},${C} ${C + coreR},${C}`);
    }

    // Outer shockwave ring
    const ringR = 4 + 54 * Math.pow(t, 0.65);
    const ringAlpha = Math.max(0, 1 - Math.pow(t, 1.2));
    if (ringAlpha > 0.03 && ringR > 5) {
      const strokeW = Math.max(1, 4 * (1 - t * 0.8));
      draws.push(`stroke "${h.primaryFade(ringAlpha.toFixed(2))}" stroke-width ${strokeW.toFixed(1)} fill none circle ${C},${C} ${(C + ringR).toFixed(1)},${C}`);
      if (t < 0.6) {
        draws.push(`stroke "${h.secondaryFade((ringAlpha * 0.8).toFixed(2))}" stroke-width 1.5 fill none circle ${C},${C} ${(C + ringR * 0.94).toFixed(1)},${C}`);
      }
    }

    // Hero-specific particle dispersion
    const nParticles = 10;
    for (let p = 0; p < nParticles; p++) {
      const angle = (p * (Math.PI * 2) / nParticles) + 0.3 * Math.sin(p * 3);
      const speed = 25 + (p % 4) * 8;
      const dist = speed * Math.pow(t, 0.75);
      const px = C + Math.cos(angle) * dist;
      const py = C + Math.sin(angle) * dist;
      const pAlpha = Math.max(0, (1 - t * 1.05) * (0.8 + 0.2 * Math.cos(p + i)));

      if (pAlpha > 0.05 && px >= 0 && px < 128 && py >= 0 && py < 128) {
        const pSize = Math.max(1, 2.5 * (1 - t * 0.6));
        if (heroKey === 'mochi' && p % 2 === 0) {
          // Cross-stitch spark
          draws.push(`stroke "${h.primaryFade(pAlpha.toFixed(2))}" stroke-width 1.5 line ${(px - pSize).toFixed(1)},${py.toFixed(1)} ${(px + pSize).toFixed(1)},${py.toFixed(1)} line ${px.toFixed(1)},${(py - pSize).toFixed(1)} ${px.toFixed(1)},${(py + pSize).toFixed(1)}`);
        } else {
          draws.push(`fill "${h.secondaryFade(pAlpha.toFixed(2))}" circle ${px.toFixed(1)},${py.toFixed(1)} ${(px + pSize).toFixed(1)},${py.toFixed(1)}`);
        }
      }
    }

    const drawArg = draws.length > 0 ? `-draw '${draws.join(' ')}'` : '';
    run(`magick -size 128x128 xc:black ${drawArg} -blur 0x0.7 "${framePng}"`);
  }

  // Montage to 512x512 atlas
  const atlasPng = path.join(workBase, `${heroKey}_impact_atlas.png`);
  run(`magick montage "${heroWork}/f_*.png" -tile 4x4 -geometry 128x128+0+0 -background black "${atlasPng}"`);
  const outWebp = path.join(vfxDir, `${heroKey}-impact.webp`);
  toWebP(atlasPng, outWebp);
  console.log(`  -> ${outWebp}`);
}

// ----------------------------------------------------------------------
// 3. TRAIL / SLASH OR PROJECTILE (Enhanced V5 Quality)
// ----------------------------------------------------------------------
function buildSlashOrProjectile(heroKey) {
  const h = HEROES[heroKey];

  if (h.slashType === 'flipbook') {
    // 4x4 flipbook slash arc (512x512 atlas, 16 frames of 128x128)
    const heroWork = path.join(workBase, `slash_${heroKey}`);
    if (fs.existsSync(heroWork)) fs.rmSync(heroWork, { recursive: true });
    fs.mkdirSync(heroWork, { recursive: true });

    const N = 16;
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1);
      const framePng = path.join(heroWork, `f_${String(i).padStart(2, '0')}.png`);
      const draws = [];

      // Sweeping arc from -40 deg to +140 deg
      const startDeg = -40 + t * 95;
      const arcLen = 35 + 75 * Math.sin(Math.min(Math.PI, t * Math.PI));
      const endDeg = startDeg + arcLen;
      const alpha = Math.max(0, 1 - Math.pow(t, 1.3));

      if (alpha > 0.04) {
        // Broad outer ribbon glow
        const strokeW = Math.max(3, 8 * Math.sin(t * Math.PI));
        draws.push(`stroke "${h.primaryFade((alpha * 0.75).toFixed(2))}" stroke-width ${strokeW.toFixed(1)} fill none arc 12,12 116,116 ${startDeg.toFixed(0)},${endDeg.toFixed(0)}`);

        // Concentric inner ribbon blade
        draws.push(`stroke "${h.primaryFade(alpha.toFixed(2))}" stroke-width ${(strokeW * 0.5).toFixed(1)} fill none arc 18,18 110,110 ${(startDeg + 4).toFixed(0)},${(endDeg - 2).toFixed(0)}`);

        // Leading razor edge (cream / butter gold)
        draws.push(`stroke "${h.secondaryFade((alpha * 0.95).toFixed(2))}" stroke-width 2 fill none arc 22,22 106,106 ${(startDeg + arcLen * 0.45).toFixed(0)},${endDeg.toFixed(0)}`);

        // Trailing hero-specific sparkles (thread stitches for Mochi, crumbs for Panko)
        const nTrailing = 6;
        for (let s = 0; s < nTrailing; s++) {
          const sparkProg = s / nTrailing;
          const sDeg = startDeg + arcLen * sparkProg * 0.7;
          const sRad = (sDeg * Math.PI) / 180;
          const r = 44 + (s % 3) * 6;
          const sx = 64 + Math.cos(sRad) * r;
          const sy = 64 + Math.sin(sRad) * r;
          const sAlpha = alpha * (1 - sparkProg) * 0.85;

          if (sAlpha > 0.05 && sx >= 0 && sx < 128 && sy >= 0 && sy < 128) {
            if (heroKey === 'mochi') {
              draws.push(`stroke "${h.primaryFade(sAlpha.toFixed(2))}" stroke-width 1.5 line ${(sx - 2).toFixed(1)},${sy.toFixed(1)} ${(sx + 2).toFixed(1)},${sy.toFixed(1)} line ${sx.toFixed(1)},${(sy - 2).toFixed(1)} ${sx.toFixed(1)},${(sy + 2).toFixed(1)}`);
            } else {
              draws.push(`fill "${h.primaryFade(sAlpha.toFixed(2))}" circle ${sx.toFixed(1)},${sy.toFixed(1)} ${(sx + 2).toFixed(1)},${sy.toFixed(1)}`);
            }
          }
        }
      }

      const drawArg = draws.length > 0 ? `-draw '${draws.join(' ')}'` : '';
      run(`magick -size 128x128 xc:black ${drawArg} -blur 0x0.7 "${framePng}"`);
    }

    const atlasPng = path.join(workBase, `${heroKey}_slash_atlas.png`);
    run(`magick montage "${heroWork}/f_*.png" -tile 4x4 -geometry 128x128+0+0 -background black "${atlasPng}"`);
    const outWebp = path.join(vfxDir, `${heroKey}-slash.webp`);
    toWebP(atlasPng, outWebp);
    console.log(`  -> ${outWebp}`);
  } else {
    // Single 256x256 high-res projectile (horizontal motion with particle tail)
    const outPng = path.join(workBase, `${heroKey}_projectile.png`);
    const outWebp = path.join(vfxDir, `${heroKey}-projectile.webp`);
    const draws = [];

    // Core projectile head at (185, 128)
    const hx = 185, hy = 128;
    draws.push(`fill "${h.secondaryFade(0.98)}" circle ${hx},${hy} ${hx + 18},${hy}`);
    draws.push(`fill "${h.primaryFade(0.85)}" circle ${hx},${hy} ${hx + 34},${hy}`);
    draws.push(`fill "${h.primaryFade(0.35)}" circle ${hx},${hy} ${hx + 54},${hy}`);

    // Streamline tails flowing left
    for (let yOff of [-16, -10, -5, 0, 5, 10, 16]) {
      const len = 135 + Math.abs(yOff) * -4;
      const alpha = 0.85 - Math.abs(yOff) * 0.035;
      draws.push(`stroke "${h.primaryFade(alpha.toFixed(2))}" stroke-width 3.5 fill none line ${(hx - 15)},${(hy + yOff)} ${(hx - len)},${(hy + yOff * 0.45)}`);
    }

    // Trailing spark motes
    for (let s = 0; s < 18; s++) {
      const sx = hx - 18 - s * 9;
      const sy = hy + (Math.sin(s * 1.3) * (14 + s * 0.8));
      const sa = (1 - s / 18) * 0.95;
      draws.push(`fill "${h.secondaryFade(sa.toFixed(2))}" circle ${sx.toFixed(1)},${sy.toFixed(1)} ${(sx + 2.5).toFixed(1)},${sy.toFixed(1)}`);
      if (s % 3 === 0) {
        draws.push(`fill "white" circle ${sx.toFixed(1)},${sy.toFixed(1)} ${(sx + 1.2).toFixed(1)},${sy.toFixed(1)}`);
      }
    }

    run(`magick -size 256x256 xc:black -draw '${draws.join(' ')}' -blur 0x1.0 "${outPng}"`);
    toWebP(outPng, outWebp);
    console.log(`  -> ${outWebp}`);
  }
}

// ----------------------------------------------------------------------
// 4. DISSIPATION PARTICLES (3 single sprites x 128 px)
// ----------------------------------------------------------------------
function buildParticles(heroKey) {
  const h = HEROES[heroKey];

  for (let pNum = 1; pNum <= 3; pNum++) {
    const outPng = path.join(workBase, `${heroKey}_particle_${pNum}.png`);
    const outWebp = path.join(vfxDir, `${heroKey}-particle-${pNum}.webp`);
    const draws = [];
    const C = 64;

    if (pNum === 1) {
      // Particle 1: Primary soft round motif (yarn puff, cinder fleck, clover sprig, butter crumb)
      draws.push(`fill "${h.primaryFade(0.85)}" circle ${C},${C} ${C + 20},${C}`);
      draws.push(`fill "${h.secondaryFade(0.9)}" circle ${C},${C} ${C + 10},${C}`);
      draws.push(`fill "white" circle ${C},${C} ${C + 4},${C}`);
    } else if (pNum === 2) {
      // Particle 2: 4-pointed sharp diamond / sparkle star
      draws.push(`stroke "${h.secondaryFade(0.95)}" stroke-width 3.5 line ${C - 28},${C} ${C + 28},${C} line ${C},${C - 28} ${C},${C + 28}`);
      draws.push(`stroke "${h.primaryFade(0.8)}" stroke-width 2 line ${C - 16},${C - 16} ${C + 16},${C + 16} line ${C - 16},${C + 16} ${C + 16},${C - 16}`);
      draws.push(`fill "white" circle ${C},${C} ${C + 5},${C}`);
    } else {
      // Particle 3: Craft stitched motif / dewdrop / fleck
      draws.push(`stroke "${h.primaryFade(0.9)}" stroke-width 3 fill none circle ${C},${C} ${C + 22},${C}`);
      draws.push(`fill "${h.secondaryFade(0.85)}" circle ${C},${C} ${C + 8},${C}`);
      draws.push(`stroke "${h.secondaryFade(0.7)}" stroke-width 2 line ${C - 12},${C - 12} ${C + 12},${C + 12}`);
    }

    run(`magick -size 128x128 xc:black -draw '${draws.join(' ')}' -blur 0x0.8 "${outPng}"`);
    toWebP(outPng, outWebp);
    console.log(`  -> ${outWebp}`);
  }
}

// ----------------------------------------------------------------------
// 5. GROUND DECAL (single 512x512)
// ----------------------------------------------------------------------
function buildGroundDecal(heroKey) {
  const h = HEROES[heroKey];
  const outPng = path.join(workBase, `${heroKey}_decal.png`);
  const outWebp = path.join(vfxDir, `${heroKey}-decal.webp`);
  const draws = [];
  const C = 256;

  // Concentric magical rune rings
  draws.push(`stroke "${h.primaryFade(0.75)}" stroke-width 4 fill none circle ${C},${C} ${C + 210},${C}`);
  draws.push(`stroke "${h.secondaryFade(0.85)}" stroke-width 2.5 fill none circle ${C},${C} ${C + 185},${C}`);
  draws.push(`stroke "${h.primaryFade(0.5)}" stroke-width 1.5 fill none circle ${C},${C} ${C + 140},${C}`);

  if (heroKey === 'mochi') {
    // Stitched cat paw in center
    // Main pad
    draws.push(`fill "${h.secondaryFade(0.8)}" circle ${C},${C + 20} ${C + 50},${C + 20}`);
    // 4 toe beans
    draws.push(`fill "${h.primaryFade(0.85)}" circle ${C - 45},${C - 40} ${C - 30},${C - 40}`);
    draws.push(`fill "${h.primaryFade(0.85)}" circle ${C - 15},${C - 55} ${C},${C - 55}`);
    draws.push(`fill "${h.primaryFade(0.85)}" circle ${C + 15},${C - 55} ${C + 30},${C - 55}`);
    draws.push(`fill "${h.primaryFade(0.85)}" circle ${C + 45},${C - 40} ${C + 60},${C - 40}`);
    // Ribbon bow stitches at cardinal positions
    for (let deg = 0; deg < 360; deg += 90) {
      const rad = (deg * Math.PI) / 180;
      const bx = C + Math.cos(rad) * 198;
      const by = C + Math.sin(rad) * 198;
      draws.push(`stroke "${h.secondaryFade(0.9)}" stroke-width 3 line ${(bx - 12).toFixed(1)},${(by - 12).toFixed(1)} ${(bx + 12).toFixed(1)},${(by + 12).toFixed(1)} line ${(bx - 12).toFixed(1)},${(by + 12).toFixed(1)} ${(bx + 12).toFixed(1)},${(by - 12).toFixed(1)}`);
    }
  } else if (heroKey === 'soot') {
    // Scorch fracture lines radiating from center
    draws.push(`fill "${h.secondaryFade(0.7)}" circle ${C},${C} ${C + 35},${C}`);
    for (let deg = 15; deg < 360; deg += 30) {
      const rad = (deg * Math.PI) / 180;
      const x1 = C + Math.cos(rad) * 35;
      const y1 = C + Math.sin(rad) * 35;
      const x2 = C + Math.cos(rad) * 195;
      const y2 = C + Math.sin(rad) * 195;
      draws.push(`stroke "${h.primaryFade(0.8)}" stroke-width 3.5 line ${x1.toFixed(1)},${y1.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`);
    }
  } else if (heroKey === 'clover') {
    // Celtic clover knot ring with 4 lobes
    for (let deg = 0; deg < 360; deg += 90) {
      const rad = (deg * Math.PI) / 180;
      const lx = C + Math.cos(rad) * 75;
      const ly = C + Math.sin(rad) * 75;
      draws.push(`stroke "${h.primaryFade(0.8)}" stroke-width 3 fill "${h.primaryFade(0.3)}" circle ${lx.toFixed(1)},${ly.toFixed(1)} ${(lx + 42).toFixed(1)},${ly.toFixed(1)}`);
      draws.push(`fill "${h.secondaryFade(0.85)}" circle ${lx.toFixed(1)},${ly.toFixed(1)} ${(lx + 12).toFixed(1)},${ly.toFixed(1)}`);
    }
  } else if (heroKey === 'panko') {
    // Toasted waffle grid ground fracture
    draws.push(`stroke "${h.secondaryFade(0.8)}" stroke-width 3 fill none rectangle ${C - 90},${C - 90} ${C + 90},${C + 90}`);
    draws.push(`stroke "${h.primaryFade(0.7)}" stroke-width 2 fill none line ${C - 90},${C} ${C + 90},${C} line ${C},${C - 90} ${C},${C + 90}`);
    for (let deg = 45; deg < 360; deg += 90) {
      const rad = (deg * Math.PI) / 180;
      const bx = C + Math.cos(rad) * 130;
      const by = C + Math.sin(rad) * 130;
      draws.push(`fill "${h.primaryFade(0.85)}" circle ${bx.toFixed(1)},${by.toFixed(1)} ${(bx + 18).toFixed(1)},${by.toFixed(1)}`);
    }
  }

  run(`magick -size 512x512 xc:black -draw '${draws.join(' ')}' -blur 0x1.2 "${outPng}"`);
  toWebP(outPng, outWebp);
  console.log(`  -> ${outWebp}`);
}

// ----------------------------------------------------------------------
// BUILD ALL HEROES
// ----------------------------------------------------------------------
for (const heroKey of Object.keys(HEROES)) {
  console.log(`\nGenerating assets for Hero: ${heroKey.toUpperCase()}...`);
  buildAnticipation(heroKey);
  buildImpactFlipbook(heroKey);
  buildSlashOrProjectile(heroKey);
  buildParticles(heroKey);
  buildGroundDecal(heroKey);
}

console.log('\nAll Hero VFX textures generated successfully!');
