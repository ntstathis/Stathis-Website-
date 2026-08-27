// 07-site-assets.mjs — copy the site-chrome assets (logo, mega-menu card images,
// fonts) from the export into src/assets and public with ASCII names.
import { copyFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const media = (url) => {
  // same mapping the downloader used: URL pathname (percent-encoded) minus /wp-content/
  const p = new URL(url).pathname.replace(/^\/wp-content\//, '');
  return path.join(ROOT, 'export/media', decodeURIComponent(p));
};
const mediaRaw = (url) => {
  const p = new URL(url).pathname.replace(/^\/wp-content\//, '');
  return path.join(ROOT, 'export/media', p);
};

const MEGA = [
  ['https://stathis.com.gr/wp-content/uploads/2024/07/Κιτ-Μόνωσης-Χώρου-Φόρτωσης-2-1.jpg', 'kit-monwsis.jpg'],
  ['https://stathis.com.gr/wp-content/uploads/2024/07/Μονώσεις-αυτοκινήτων-Van-1.jpg', 'monwseis-van.jpg'],
  ['https://stathis.com.gr/wp-content/uploads/2024/07/Ψυκτικά-Μηχανήματα-2.jpg', 'psuktika-mixanimata.jpg'],
  ['https://stathis.com.gr/wp-content/uploads/2024/07/Ψυκτικοί-Θάλαμοι-Φορτηγών.jpg', 'psuktikoi-thalamoi.jpg'],
  ['https://stathis.com.gr/wp-content/uploads/2024/07/Κιβωτάμαξες-Κόφες.jpg', 'kivwtamakses.jpg'],
  ['https://stathis.com.gr/wp-content/uploads/2024/07/Θάλαμοι-Βαθιάς-Κατάψυξης-Τσέλες.jpg', 'thalamoi-vatheias.jpg'],
  ['https://stathis.com.gr/wp-content/uploads/2024/07/Sortimo.jpg', 'sortimo.jpg'],
  ['https://stathis.com.gr/wp-content/uploads/2024/07/Υδραυλικές-Πόρτες.jpg', 'ydraulikes-portes.jpg'],
  ['https://stathis.com.gr/wp-content/uploads/2024/07/Eξοπλισμός-Oχημάτων-Pick-Up.jpg', 'road-ranger.jpg'],
  ['https://stathis.com.gr/wp-content/uploads/2024/07/Καταγραφικά-Θερμοκρασίας-Euroscan-2.jpg', 'katagrafika-euroscan.jpg'],
  ['https://stathis.com.gr/wp-content/uploads/2025/02/Κλειδαριές_Gatelock.jpg', 'kleidaries-gatelock.jpg'],
  ['https://stathis.com.gr/wp-content/uploads/2025/02/Ανοξείδωτη_Σχάρα_Οροφής.jpg', 'schara-orofis.jpg'],
  ['https://stathis.com.gr/wp-content/uploads/2025/07/Καρότσες-αλουμινίου.jpg', 'karotses-alouminiou.jpg'],
  ['https://stathis.com.gr/wp-content/uploads/2025/07/Ψυκτικά-δοχεία.jpg', 'psyktika-docheia.jpg'],
  ['https://stathis.com.gr/wp-content/uploads/2024/08/BOXER-L2H2-ΧΩΝΕΥΤΟ-1-scaled.jpg', 'van-rent.jpg'],
  ['https://stathis.com.gr/wp-content/uploads/2024/08/BOXER-L2H2-ΧΩΝΕΥΤΟ-1-edited-scaled.jpg', 'van-rent-en.jpg'],
  ['https://stathis.com.gr/wp-content/uploads/2024/01/mega-menu-2.png', 'mega-configurator.png'],
  ['https://stathis.com.gr/wp-content/uploads/2024/01/mega-menu-3.png', 'mega-after-sales.png'],
];

const megaDir = path.join(ROOT, 'src/assets/img/site/mega');
const siteDir = path.join(ROOT, 'src/assets/img/site');
const fontDir = path.join(ROOT, 'public/fonts');
await mkdir(megaDir, { recursive: true });
await mkdir(fontDir, { recursive: true });

let ok = 0, missing = [];
for (const [url, name] of MEGA) {
  const src = [media(url), mediaRaw(url)].find((p) => existsSync(p));
  if (!src) { missing.push(url); continue; }
  await copyFile(src, path.join(megaDir, name));
  ok++;
}

const logoUrl = 'https://stathis.com.gr/wp-content/uploads/2024/01/Logo-Stathis-1.png';
const logoSrc = [media(logoUrl), mediaRaw(logoUrl)].find((p) => existsSync(p));
if (logoSrc) { await copyFile(logoSrc, path.join(siteDir, 'logo-stathis.png')); ok++; }
else missing.push(logoUrl);

for (const f of ['PFDinText-Regular.otf', 'PFDinText-Bold.otf']) {
  const src = path.join(ROOT, 'export/fonts', f);
  if (existsSync(src)) { await copyFile(src, path.join(fontDir, f)); ok++; }
  else missing.push(f);
}

console.log(`copied ${ok}; missing ${missing.length}`);
for (const m of missing) console.log('  MISSING: ' + m);
