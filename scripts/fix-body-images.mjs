// fix-body-images.mjs — content markdown bodies embed raw
// <img src="/src/assets/img/..."> inside HTML blocks; those paths do not go
// through the asset pipeline and would 404 on the built site. This script:
//   1. finds every such reference in src/content/**/*.md
//   2. copies the file to public/img/<same subpath>, downscaling anything
//      wider than 1600px (sharp, from Astro's own dependency tree)
//   3. rewrites the body src to /img/<subpath> (frontmatter is left alone —
//      frontmatter images go through the glob + <Image> pipeline in layouts)
// Idempotent; run after content conversion, before the final build.

import { readFile, writeFile, readdir, mkdir, copyFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const ROOT = path.resolve(import.meta.dirname, '..');
const require = createRequire(path.join(ROOT, 'package.json'));
let sharp = null;
try {
  sharp = require('sharp');
} catch {
  console.warn('sharp unavailable — copying without downscale');
}

async function* walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else yield p;
  }
}

const RE = /(["'(])\/src\/assets\/img\/([^"')\s]+)/g;
let filesChanged = 0, imagesMoved = 0, missing = 0, resized = 0;
const moved = new Set();

for await (const file of walk(path.join(ROOT, 'src/content'))) {
  if (!file.endsWith('.md')) continue;
  const text = await readFile(file, 'utf8');
  const fmEnd = text.indexOf('---', 3); // keep frontmatter untouched
  const head = text.slice(0, fmEnd + 3);
  let body = text.slice(fmEnd + 3);
  if (!RE.test(body)) continue;
  RE.lastIndex = 0;

  const jobs = new Map();
  body = body.replace(RE, (m, pre, sub) => {
    jobs.set(sub, true);
    return `${pre}/img/${sub}`;
  });
  for (const sub of jobs.keys()) {
    if (moved.has(sub)) continue;
    moved.add(sub);
    const srcFile = path.join(ROOT, 'src/assets/img', sub);
    const dest = path.join(ROOT, 'public/img', sub);
    if (!existsSync(srcFile)) {
      console.error(`MISSING asset for body img: src/assets/img/${sub}`);
      missing++;
      continue;
    }
    await mkdir(path.dirname(dest), { recursive: true });
    let done = false;
    if (sharp && /\.(jpe?g|png|webp)$/i.test(sub)) {
      try {
        const meta = await sharp(srcFile).metadata();
        if ((meta.width ?? 0) > 1600) {
          await sharp(srcFile).resize({ width: 1600 }).toFile(dest);
          resized++;
          done = true;
        }
      } catch {}
    }
    if (!done) await copyFile(srcFile, dest);
    imagesMoved++;
  }
  await writeFile(file, head + body, 'utf8');
  filesChanged++;
}
console.log(
  `body images: ${filesChanged} md files rewritten, ${imagesMoved} images placed in public/img (${resized} downscaled), ${missing} missing`,
);
if (missing) process.exit(1);
