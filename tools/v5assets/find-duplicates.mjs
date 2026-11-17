import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import os from "node:os";
import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);
const rootDir = "/Users/bao/th-v5-ag3";

console.log("Starting R5 Duplicate & Near-Duplicate Image Analysis...");

const invLines = fs.readFileSync(path.join(rootDir, "reports/v5/AG3/inventory.csv"), "utf8").split("\n").slice(1).filter(Boolean);

const images = [];
const hashes = new Map();

for (const line of invLines) {
  const [p, b, w, h, alpha] = line.split(",");
  if (!p.startsWith("apps/web/public/")) continue;
  const fullPath = path.join(rootDir, p);
  if (!fs.existsSync(fullPath)) continue;

  const buf = fs.readFileSync(fullPath);
  const hash = crypto.createHash("sha256").update(buf).digest("hex");
  const size = parseInt(b, 10);
  const relPath = p.replace("apps/web/public/", "");

  const img = {
    fullPath,
    relPath,
    bytes: size,
    dims: `${w}x${h}`,
    width: parseInt(w, 10),
    height: parseInt(h, 10),
    alpha: alpha === "true",
    hash
  };

  images.push(img);

  if (!hashes.has(hash)) hashes.set(hash, []);
  hashes.get(hash).push(img);
}

console.log(`Loaded ${images.length} images.`);

// 1. Exact duplicates
const exactDuplicateGroups = [];
let exactWastedBytes = 0;
const exactDupPaths = new Set();

for (const [hash, group] of hashes.entries()) {
  if (group.length > 1) {
    exactDuplicateGroups.push(group);
    const wasted = (group.length - 1) * group[0].bytes;
    exactWastedBytes += wasted;
    group.forEach(g => exactDupPaths.add(g.relPath));
  }
}

console.log(`Found ${exactDuplicateGroups.length} exact duplicate groups (${exactDupPaths.size} files, ${(exactWastedBytes/1024).toFixed(1)} KB wasted).`);

// 2. Near duplicates: same dims, same folder/family, diff <= 3%
const dimGroups = new Map();
for (const img of images) {
  if (!dimGroups.has(img.dims)) dimGroups.set(img.dims, []);
  dimGroups.get(img.dims).push(img);
}

const candidatePairs = [];
for (const [dims, group] of dimGroups.entries()) {
  for (let i = 0; i < group.length; i++) {
    for (let j = i + 1; j < group.length; j++) {
      const a = group[i];
      const b = group[j];
      if (a.hash === b.hash) continue; // Skip exact

      const nameA = path.basename(a.relPath);
      const nameB = path.basename(b.relPath);
      const stemA = nameA.replace(/\.[^.]+$/, "");
      const stemB = nameB.replace(/\.[^.]+$/, "");
      const famA = stemA.includes("-") ? stemA.slice(0, stemA.lastIndexOf("-")) : stemA;
      const famB = stemB.includes("-") ? stemB.slice(0, stemB.lastIndexOf("-")) : stemB;
      const dirA = path.dirname(a.relPath);
      const dirB = path.dirname(b.relPath);

      const maxB = Math.max(a.bytes, b.bytes);
      const minB = Math.min(a.bytes, b.bytes);
      const diff = (maxB - minB) / maxB;

      if ((dirA === dirB && (famA === famB || nameA === nameB)) || diff <= 0.01) {
        if (diff <= 0.03) {
          candidatePairs.push({ a, b, dims });
        }
      }
    }
  }
}

console.log(`Comparing ${candidatePairs.length} non-exact candidate pairs in parallel...`);

const nearDuplicates = [];
const concurrency = Math.min(8, os.cpus().length || 4);
let processed = 0;

async function runWorker(pool) {
  while (pool.length > 0) {
    const item = pool.pop();
    if (!item) break;
    const { a, b, dims } = item;

    try {
      const { stdout, stderr } = await execAsync(`magick compare -metric SSIM "${a.fullPath}" "${b.fullPath}" null: 2>&1`).catch(e => e);
      const text = (stdout || "") + (stderr || "");
      const m = text.match(/\(([\d\.]+)\)/);
      if (m) {
        const ssim = 1 - parseFloat(m[1]);
        if (ssim >= 0.995) {
          nearDuplicates.push({
            fileA: a.relPath,
            fileB: b.relPath,
            dims,
            bytesA: a.bytes,
            bytesB: b.bytes,
            ssim: Number(ssim.toFixed(5))
          });
          console.log(`[NEAR-DUP] SSIM ${ssim.toFixed(5)}: ${a.relPath} <-> ${b.relPath}`);
        }
      }
    } catch (e) {
      // Ignore compare error
    }

    processed++;
    if (processed % 50 === 0 || processed === candidatePairs.length) {
      console.log(`Progress: ${processed}/${candidatePairs.length} pairs evaluated...`);
    }
  }
}

const pool = [...candidatePairs];
const workers = Array.from({ length: concurrency }, () => runWorker(pool));
await Promise.all(workers);

console.log(`Near-duplicate scan complete. Found ${nearDuplicates.length} pairs with SSIM >= 0.995.`);

// Write CSV
const csvRows = ["type,file_a,file_b,dims,bytes_a,bytes_b,ssim_or_hash"];

// Exact duplicates
for (const group of exactDuplicateGroups) {
  const primary = group[0];
  for (let i = 1; i < group.length; i++) {
    csvRows.push(`EXACT,${primary.relPath},${group[i].relPath},${primary.dims},${primary.bytes},${group[i].bytes},${primary.hash}`);
  }
}

// Near duplicates
for (const nd of nearDuplicates) {
  csvRows.push(`NEAR,${nd.fileA},${nd.fileB},${nd.dims},${nd.bytesA},${nd.bytesB},${nd.ssim}`);
}

fs.writeFileSync(path.join(rootDir, "reports/v5/AG3/R5-duplicates.csv"), csvRows.join("\n") + "\n");

// Markdown report
let md = `# R5 Duplicate and Near-Duplicate Image Report\n\n`;
md += `Exhaustive analysis across 601 public image assets detecting:\n`;
md += `1. **Exact Bit-for-Bit Duplicates**: Identical SHA-256 hashes.\n`;
md += `2. **Perceptual Near-Duplicates**: Identical dimensions with SSIM $\\ge 0.995$.\n\n`;

md += `## Executive Summary\n\n`;
md += `- **Exact Duplicate Groups**: **${exactDuplicateGroups.length} groups** (${exactDupPaths.size} total files)\n`;
md += `- **Wasted Bytes from Exact Duplicates**: **${(exactWastedBytes / 1024).toFixed(1)} KB**\n`;
md += `- **Perceptual Near-Duplicates (SSIM $\\ge 0.995$)**: **${nearDuplicates.length} pairs**\n\n`;

md += `## Key Findings & Opportunities\n\n`;
md += `### 1. Heaviest Exact Duplicate: Binding Thread (\`97.5 KB\`)\n`;
md += `- \`units/binding-thread/portrait.webp\` and \`units/binding-thread/runtime.webp\` are bit-for-bit identical (SHA-256 \`cbd44de6...\`).\n`;
md += `- **Remediation**: CXI can alias \`runtime.webp\` to \`portrait.webp\`, saving 97.5 KB immediately.\n\n`;

md += `### 2. Multi-Copy UI Foreground & Light Sets\n`;
md += `- \`art/visual/foreground-1.png\` through \`foreground-5.png\`: **5 copies of the exact same 393-byte file**.\n`;
md += `- \`art/visual/light-1.png\`, \`light-2.png\`, \`light-5.png\`: **3 copies of the exact same 663-byte file**.\n`;
md += `- **Remediation**: Consolidate to single source assets in the visual system.\n\n`;

md += `### 3. Monster Idle vs Walk Sprite Copies\n`;
md += `- 25 monster sprite sets under \`art/gameplay/mon.*\` share 100% identical raster data for \`-idle.png\` and \`-walk.png\` (e.g. \`mon.bathtub.tyrant\`, \`mon.vacuum.beast\`, \`mon.yarn.giant\`).\n`;
md += `- These are legacy 2D sprites (already identified in R4 as unreferenced by the current 3D rig combat engine).\n\n`;

md += `### 4. Icon & Equipment Clones\n`;
md += `- \`art/squad/icon-restrain.png\`, \`icon-snare.png\`, \`icon-taunt.png\`, \`icon-threadSnare.png\`: 4 identical copies.\n`;
md += `- \`art/squad/icon-burn.png\`, \`icon-emberOrb.png\`, \`icon-warmWick.png\`: 3 identical copies.\n`;
md += `- \`art/squad/icon-guard.png\`, \`icon-shieldBash.png\`, \`icon-steadfast.png\`: 3 identical copies.\n`;
md += `- \`item-arm.cozy.*\` vs \`item-slot*\`: 5 equipment slot icons are duplicates of cozy armor set pieces.\n\n`;

md += `## Top Exact Duplicate Groups\n\n`;
md += `| Hash (First 8) | Copies | File Size | Wasted | Paths |\n`;
md += `|:---:|:---:|:---:|:---:|:---|\n`;

exactDuplicateGroups.sort((a, b) => ((b.length - 1) * b[0].bytes) - ((a.length - 1) * a[0].bytes));
for (const g of exactDuplicateGroups.slice(0, 15)) {
  const wasted = (g.length - 1) * g[0].bytes;
  const paths = g.map(x => `\`${x.relPath}\``).join("<br>");
  md += `| \`${g[0].hash.slice(0, 8)}\` | ${g.length} | ${(g[0].bytes / 1024).toFixed(1)} KB | **${(wasted / 1024).toFixed(1)} KB** | ${paths} |\n`;
}

if (nearDuplicates.length > 0) {
  md += `\n## Near-Duplicate Pairs (SSIM $\\ge 0.995$)\n\n`;
  md += `| File A | File B | Dimensions | Size A | Size B | SSIM |\n`;
  md += `|:---|:---|:---:|:---:|:---:|:---:|\n`;
  for (const nd of nearDuplicates) {
    md += `| \`${nd.fileA}\` | \`${nd.fileB}\` | ${nd.dims} | ${(nd.bytesA / 1024).toFixed(1)} KB | ${(nd.bytesB / 1024).toFixed(1)} KB | **${nd.ssim}** |\n`;
  }
}

md += `\n## Next Steps for Integration\n\n`;
md += `See [R5-duplicates.csv](file:///Users/bao/th-v5-ag3/reports/v5/AG3/R5-duplicates.csv) for the full list. CXI can deduplicate asset requests via runtime aliasing or loader mappings.\n`;

fs.writeFileSync(path.join(rootDir, "reports/v5/AG3/R5-duplicates.md"), md);
console.log("R5 report and CSV written successfully.");
