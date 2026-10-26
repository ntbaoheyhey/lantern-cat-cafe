#!/usr/bin/env node
// Dependency-free checker that scans README.md and docs/**/*.md for:
// 1. Relative markdown links ([text](target) and <a href="target">)
// 2. Image paths (![alt](target), <img src="target">, and backticked image paths)
// 3. Backticked repository paths (e.g. `apps/web/src/...`, `packages/...`, `contracts/...`)
//
// Exits non-zero (1) if any link or path does not exist on disk, 0 when all exist.
// Usage: node scripts/check-links.mjs [--verbose] [--json] [files...]

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, '..');

// Top-level repository directories whose paths are checked in backticks
const REPO_DIRS = [
  'apps',
  'packages',
  'contracts',
  'supabase',
  'scripts',
  'docs',
  '.github',
  'reports',
  'screenshots',
];

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico']);

// CLI argument parsing
const args = process.argv.slice(2);
const verbose = args.includes('--verbose');
const jsonOutput = args.includes('--json');
const customFiles = args.filter((arg) => !arg.startsWith('--'));

/** Recursively collect all markdown files under a directory */
function collectMarkdownFiles(dir) {
  const results = [];
  if (!existsSync(dir)) return results;

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectMarkdownFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      // Exclude the generated link-check report to prevent recursive self-reporting
      if (entry.name === 'link-check.md') continue;
      results.push(fullPath);
    }
  }
  return results;
}

// Determine target files to check
let targetFiles = [];
if (customFiles.length > 0) {
  targetFiles = customFiles.map((f) => resolve(process.cwd(), f));
} else {
  const readme = join(repoRoot, 'README.md');
  if (existsSync(readme)) targetFiles.push(readme);
  targetFiles.push(...collectMarkdownFiles(join(repoRoot, 'docs')));
}

targetFiles.sort();

const brokenItems = [];
let totalLinksChecked = 0;
let totalFilesChecked = 0;

/**
 * Check if a path exists on disk either relative to the repo root or the markdown file.
 */
function resolveAndCheck(target, fileDir) {
  // Strip fragment (#...) and query string (?...)
  const cleanTarget = target.split('#')[0].split('?')[0].trim();
  if (!cleanTarget) return { exists: true, resolved: target };

  let decoded;
  try {
    decoded = decodeURIComponent(cleanTarget);
  } catch {
    decoded = cleanTarget;
  }

  // If path starts with root slash, treat as repo-root relative
  if (decoded.startsWith('/')) {
    const fromRoot = resolve(repoRoot, '.' + decoded);
    return { exists: existsSync(fromRoot), resolved: fromRoot };
  }

  // Check from repo root first
  const fromRoot = resolve(repoRoot, decoded);
  if (existsSync(fromRoot)) {
    return { exists: true, resolved: fromRoot };
  }

  // Check relative to file directory
  const fromFileDir = resolve(fileDir, decoded);
  if (existsSync(fromFileDir)) {
    return { exists: true, resolved: fromFileDir };
  }

  return { exists: false, resolved: fromRoot };
}

/**
 * Check whether a backticked token looks like a repo path or image path.
 */
function classifyBacktickToken(token) {
  const trimmed = token.trim();

  // Skip empty or tokens that are clearly shell commands with options, code expressions, or URLs
  if (!trimmed) return null;
  if (/^(?:https?:\/\/|\/\/|mailto:|data:)/i.test(trimmed)) return null;
  if (/^(?:git|pnpm|forge|curl|node|cast|anvil|rm|echo|cat|chmod)\s+/i.test(trimmed)) return null;
  if (/^(?:POST|GET|PUT|DELETE|PATCH)\s+/i.test(trimmed)) return null;
  if (trimmed.startsWith('@')) return null; // Scoped npm package (@taskbar-hero/...)

  // Angle-bracket segments describe a template, not a literal committed file.
  // Only backticked examples are exempt; real Markdown/HTML links still resolve.
  if (/<[^<>/]+>/.test(trimmed)) return null;

  // Relative paths starting with ./ or ../
  if (trimmed.startsWith('./') || trimmed.startsWith('../')) {
    return 'repo-path';
  }

  // Paths starting with top-level repository directories
  for (const dir of REPO_DIRS) {
    if (trimmed === dir || trimmed.startsWith(dir + '/')) {
      return 'repo-path';
    }
  }

  // Backticked image file references (e.g. `og.png`)
  const dotIndex = trimmed.lastIndexOf('.');
  if (dotIndex > 0 && !trimmed.includes(' ') && !trimmed.includes('{') && !trimmed.includes('$')) {
    const ext = trimmed.slice(dotIndex).toLowerCase();
    if (IMAGE_EXTENSIONS.has(ext)) {
      return 'image-path';
    }
  }

  return null;
}

// Process each file
for (const filePath of targetFiles) {
  totalFilesChecked++;
  const relFilePath = relative(repoRoot, filePath);
  const fileDir = dirname(filePath);
  const content = readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  let inFencedBlock = false;

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const lineNum = lineIndex + 1;
    const line = lines[lineIndex];

    // Track fenced code blocks (``` or ~~~)
    if (/^\s*(```|~~~)/.test(line)) {
      inFencedBlock = !inFencedBlock;
      continue;
    }
    if (inFencedBlock) continue;

    // 1. Markdown links [text](target) and images ![alt](target)
    const linkMatches = line.matchAll(/(?<!!)\[([^\]]*)\]\(([^)]+)\)|!\[([^\]]*)\]\(([^)]+)\)/g);
    for (const match of linkMatches) {
      const isImage = match[0].startsWith('!');
      const rawTarget = (match[2] || match[4]).trim();

      // Skip external protocols, pure anchors, and javascript:
      if (/^(?:[a-zA-Z][a-zA-Z0-9+.-]*:|\/\/|#)/i.test(rawTarget)) continue;

      totalLinksChecked++;
      const { exists, resolved } = resolveAndCheck(rawTarget, fileDir);
      if (!exists) {
        brokenItems.push({
          file: relFilePath,
          line: lineNum,
          type: isImage ? 'image link' : 'relative link',
          raw: rawTarget,
          resolved: relative(repoRoot, resolved),
        });
      } else if (verbose) {
        console.log(`[OK] ${relFilePath}:${lineNum} ${isImage ? 'image' : 'link'} -> ${rawTarget}`);
      }
    }

    // 2. HTML <img> tags: <img ... src="...">
    const htmlImgMatches = line.matchAll(/<img\s+[^>]*src=["']([^"']+)["']/gi);
    for (const match of htmlImgMatches) {
      const rawTarget = match[1].trim();
      if (/^(?:[a-zA-Z][a-zA-Z0-9+.-]*:|\/\/|#)/i.test(rawTarget)) continue;

      totalLinksChecked++;
      const { exists, resolved } = resolveAndCheck(rawTarget, fileDir);
      if (!exists) {
        brokenItems.push({
          file: relFilePath,
          line: lineNum,
          type: 'html image',
          raw: rawTarget,
          resolved: relative(repoRoot, resolved),
        });
      } else if (verbose) {
        console.log(`[OK] ${relFilePath}:${lineNum} html image -> ${rawTarget}`);
      }
    }

    // 3. HTML <a> tags: <a ... href="...">
    const htmlAnchorMatches = line.matchAll(/<a\s+[^>]*href=["']([^"']+)["']/gi);
    for (const match of htmlAnchorMatches) {
      const rawTarget = match[1].trim();
      if (/^(?:[a-zA-Z][a-zA-Z0-9+.-]*:|\/\/|#)/i.test(rawTarget)) continue;

      totalLinksChecked++;
      const { exists, resolved } = resolveAndCheck(rawTarget, fileDir);
      if (!exists) {
        brokenItems.push({
          file: relFilePath,
          line: lineNum,
          type: 'html link',
          raw: rawTarget,
          resolved: relative(repoRoot, resolved),
        });
      } else if (verbose) {
        console.log(`[OK] ${relFilePath}:${lineNum} html link -> ${rawTarget}`);
      }
    }

    // 4. Backticked repo paths and image paths
    const codeMatches = line.matchAll(/(?<!`)(?:`)([^`\n]+)(?:`)(?!`)/g);
    for (const match of codeMatches) {
      const token = match[1].trim();
      const kind = classifyBacktickToken(token);
      if (!kind) continue;

      totalLinksChecked++;
      const { exists, resolved } = resolveAndCheck(token, fileDir);
      if (!exists) {
        brokenItems.push({
          file: relFilePath,
          line: lineNum,
          type: kind === 'image-path' ? 'backticked image path' : 'backticked repo path',
          raw: token,
          resolved: relative(repoRoot, resolved),
        });
      } else if (verbose) {
        console.log(`[OK] ${relFilePath}:${lineNum} backticked path -> ${token}`);
      }
    }
  }
}

// Output results
if (jsonOutput) {
  console.log(
    JSON.stringify(
      {
        totalFilesChecked,
        totalLinksChecked,
        brokenCount: brokenItems.length,
        brokenItems,
      },
      null,
      2
    )
  );
} else {
  console.log(`Checked ${totalFilesChecked} markdown files and ${totalLinksChecked} links/paths.\n`);

  if (brokenItems.length === 0) {
    console.log('✓ All links, image paths, and backticked repo paths exist on disk.');
  } else {
    console.log(`Found ${brokenItems.length} broken link(s) or path(s) on disk:\n`);
    for (const item of brokenItems) {
      console.log(`  ${item.file}:${item.line} [${item.type}]`);
      console.log(`    Target: \`${item.raw}\``);
      console.log(`    Not found: ${item.resolved}\n`);
    }
  }
}

// Exit non-zero if anything broken was found
if (brokenItems.length > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
