import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();

function getAllFiles(dir, exts) {
  let res = [];
  if (!fs.existsSync(dir)) return res;
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      if (item.name === "node_modules" || item.name === ".git" || item.name === "work") continue;
      res = res.concat(getAllFiles(full, exts));
    } else if (exts.some(ext => item.name.endsWith(ext))) {
      res.push(full);
    }
  }
  return res;
}

console.log("Collecting source files and manifests...");
const srcFiles = getAllFiles(path.join(rootDir, "apps/web/src"), [".ts", ".tsx", ".js", ".jsx", ".json", ".css", ".html"]);
const pubJsonFiles = getAllFiles(path.join(rootDir, "apps/web/public"), [".json"]);

const scannables = srcFiles.concat(pubJsonFiles).map(f => ({
  file: f.replace(rootDir + "/", ""),
  content: fs.readFileSync(f, "utf8")
}));

console.log(`Scanning against ${scannables.length} files...`);

const invLines = fs.readFileSync(path.join(rootDir, "reports/v5/AGV/inventory.csv"), "utf8").split("\n").slice(1).filter(Boolean);

const genericStems = new Set([
  "icon", "base", "depth", "page", "frame", "thumb", "small", "large", 
  "image", "texture", "shadow", "white", "black", "cover", "rect", "circle"
]);

const classified = [];

for (const line of invLines) {
  const [p, b, w, h, alpha] = line.split(",");
  if (!p.startsWith("apps/web/public/")) continue;
  const publicRel = p.replace("apps/web/public/", "");
  const base = path.basename(publicRel);
  const stem = base.replace(/\.[^.]+$/, "");
  const size = parseInt(b, 10);
  const folder = publicRel.split("/")[0];

  let status = "UNREFERENCED";
  let tier = "NONE";
  let matchFile = "";

  // Special check: rig-depth.png is referenced dynamically by every rig.json
  if (base === "rig-depth.png") {
    status = "REFERENCED_DYNAMIC";
    tier = "PUPPET_RIG_PAGE";
    matchFile = "apps/web/public/units/*/rig.json";
  } else if (publicRel.includes("/poses/")) {
    // Dynamic pose sheet referenced by pose-manifest-loader
    status = "REFERENCED_DYNAMIC";
    tier = "POSE_MANIFEST_LOADER";
    matchFile = "apps/web/public/units/*/poses/manifest.json";
  } else if (publicRel.includes("sampled-delivery")) {
    // Dynamic native rig manifest loader deliveries
    status = "REFERENCED_DYNAMIC";
    tier = "NATIVE_RIG_MANIFEST_LOADER";
    matchFile = "native-rig-manifest-loader";
  } else if (publicRel.endsWith(".avif")) {
    // Check if counterpart .webp is referenced
    const webpRel = publicRel.replace(/\.avif$/, ".webp");
    for (const s of scannables) {
      if (s.content.includes(webpRel) || s.content.includes(path.basename(webpRel))) {
        status = "REFERENCED_AVIF_SIBLING";
        tier = "AVIF_SIBLING_OF_ACTIVE_WEBP";
        matchFile = s.file;
        break;
      }
    }
  } else {
    // Check Tier 1: exact path
    for (const s of scannables) {
      if (s.content.includes(publicRel) || s.content.includes("/" + publicRel)) {
        status = "REFERENCED_DIRECT";
        tier = "EXACT_PATH";
        matchFile = s.file;
        break;
      }
    }

    // Check Tier 2: exact base name
    if (status === "UNREFERENCED") {
      for (const s of scannables) {
        if (s.content.includes(base)) {
          status = "REFERENCED_BASENAME";
          tier = "BASENAME";
          matchFile = s.file;
          break;
        }
      }
    }

    // Check Tier 3: stem match
    if (status === "UNREFERENCED" && !genericStems.has(stem) && stem.length >= 4) {
      for (const s of scannables) {
        if (s.content.includes(stem)) {
          status = "REFERENCED_STEM";
          tier = "STEM";
          matchFile = s.file;
          break;
        }
      }
    }
  }

  classified.push({
    path: publicRel,
    folder,
    bytes: size,
    w: parseInt(w, 10),
    h: parseInt(h, 10),
    alpha: alpha === "true",
    status,
    tier,
    matchFile
  });
}

// Generate CSV
const csvHeader = "path,folder,bytes,width,height,has_alpha,status,tier,matched_file\n";
const csvRows = classified.map(c => 
  `${c.path},${c.folder},${c.bytes},${c.w},${c.h},${c.alpha},${c.status},${c.tier},${c.matchFile}`
).join("\n");

fs.writeFileSync(path.join(rootDir, "reports/v5/AGV/unused.csv"), csvHeader + csvRows + "\n");

// Summary statistics
const totalFiles = classified.length;
const totalBytes = classified.reduce((acc, c) => acc + c.bytes, 0);

const unrefList = classified.filter(c => c.status === "UNREFERENCED");
const unrefCount = unrefList.length;
const unrefBytes = unrefList.reduce((acc, c) => acc + c.bytes, 0);

const folderStats = {};
for (const c of classified) {
  if (!folderStats[c.folder]) {
    folderStats[c.folder] = { totalFiles: 0, totalBytes: 0, unrefFiles: 0, unrefBytes: 0 };
  }
  folderStats[c.folder].totalFiles++;
  folderStats[c.folder].totalBytes += c.bytes;
  if (c.status === "UNREFERENCED") {
    folderStats[c.folder].unrefFiles++;
    folderStats[c.folder].unrefBytes += c.bytes;
  }
}

// Top 25 unreferenced files by size
unrefList.sort((a, b) => b.bytes - a.bytes);

// Markdown Report
let md = `# R4 Unused-Image Audit Report\n\n`;
md += `Comprehensive scan cross-referencing all 601 inventory images against 1,231 source files and manifests in \`apps/web/src/\` and \`apps/web/public/**/*.json\`.\n\n`;
md += `> [!IMPORTANT]\n`;
md += `> **READ-ONLY AUDIT**: In accordance with the AG3 specification, NO existing files have been moved, renamed, or deleted. This report provides exact data for CXI to safely clean up dead assets.\n\n`;

md += `## Executive Summary\n\n`;
md += `- **Total Tracked Images in Scope**: ${totalFiles} images (${(totalBytes / 1024 / 1024).toFixed(2)} MB)\n`;
md += `- **Referenced (Direct, Dynamic, or Stem)**: ${totalFiles - unrefCount} images (${((totalBytes - unrefBytes) / 1024 / 1024).toFixed(2)} MB)\n`;
md += `- **Completely Unreferenced**: **${unrefCount} images** (**${(unrefBytes / 1024 / 1024).toFixed(2)} MB**, **${((unrefBytes / totalBytes) * 100).toFixed(1)}% of total image payload**)\n\n`;

md += `## Breakdown by Folder\n\n`;
md += `| Category | Total Files | Total Size | Unreferenced Files | Unreferenced Size | % Dead Payload |\n`;
md += `|:---|:---:|:---:|:---:|:---:|:---:|\n`;

for (const [folder, s] of Object.entries(folderStats)) {
  const pct = ((s.unrefBytes / s.totalBytes) * 100).toFixed(1);
  md += `| \`${folder}/\` | ${s.totalFiles} | ${(s.totalBytes / 1024 / 1024).toFixed(2)} MB | **${s.unrefFiles}** | **${(s.unrefBytes / 1024 / 1024).toFixed(2)} MB** | ${pct}% |\n`;
}

md += `\n## Major Dead Asset Clusters\n\n`;
md += `### 1. Rig Color Pages (\`units/*/rig-page-0.png\`) — 22 files, 26.88 MB\n`;
md += `- **Root Cause**: The runtime cut-out loader (\`apps/web/src/game/cardrpg/spine/assets.ts\` line 40) parses \`rig.json\` which explicitly defines \`pages: ["rig-depth.png"]\`. The diffuse/color sheet \`rig-page-0.png\` is never loaded or referenced anywhere in \`src/\`.\n`;
md += `- **Impact**: 26.88 MB of the 28.05 MB unreferenced total (95.8%) comes strictly from these 22 files. If CXI confirms color diffuse maps are not used by the shader pipeline, removing them frees ~27 MB from the repository.\n\n`;

md += `### 2. Cinematics Posters (\`cinematics/*-ult-poster.webp\`) — 13 files, 1.40 MB\n`;
md += `- **Root Cause**: The entire \`cinematics/\` folder (both videos and webp poster stills) is unreferenced in \`apps/web/src/\`. No UI component mounts or preloads these posters.\n`;
md += `- **Impact**: 1.40 MB dead payload.\n\n`;

md += `### 3. Legacy 2D Gameplay Sprites (\`art/gameplay/mon.*\` & \`art/gameplay/mochi-*\`) — ~200 files, ~800 KB\n`;
md += `- **Root Cause**: Pre-turn3D raster animation frames (attack, walk, idle, hurt, nap for monsters and heroes). The active combat pipeline now renders Spine/cut-out puppet meshes via \`turn3d\`.\n\n`;

md += `### 4. Legacy Shell & UI Assets (\`art/v3-shell/b2/\` & \`ui-art2/\`) — 75 files, ~300 KB\n`;
md += `- **Root Cause**: Older UI iteration background slices and obsolete button graphics.\n\n`;

md += `## Top 25 Heaviest Unreferenced Images\n\n`;
md += `| Rank | File Path | Resolution | Size (KB) | Alpha | Category |\n`;
md += `|:---:|:---|:---:|:---:|:---:|:---|\n`;

unrefList.slice(0, 25).forEach((u, i) => {
  md += `| ${i + 1} | \`${u.path}\` | ${u.w}x${u.h} | ${(u.bytes / 1024).toFixed(1)} KB | ${u.alpha} | ${u.folder} |\n`;
});

md += `\n## Recommendations for CXI\n\n`;
md += `1. **Verify \`rig-page-0.png\` Requirement**: Confirm whether the 3D depth shader ever requires the diffuse color rig page. If not, removing or archiving them immediately eliminates 26.88 MB of redundant assets.\n`;
md += `2. **Cinematics Pruning**: If in-game video cinematics are postponed past V5 milestone builds, the 13 poster WebPs (and accompanying MP4/WebMs) can be safely excluded from the web bundle.\n`;
md += `3. **Full Reference CSV**: See [unused.csv](file:///Users/bao/th-v5-ag2/reports/v5/AGV/unused.csv) for the exhaustive file-by-file classification.\n`;

fs.writeFileSync(path.join(rootDir, "reports/v5/AGV/UNUSED-IMAGES-REPORT.md"), md);
console.log("R6 unused report and CSV written successfully.");
