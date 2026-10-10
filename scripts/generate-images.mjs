// One-off generator: creates local, on-brand SVG placeholder images so the
// prototype is fully presentable offline (no dependency on the removed
// /manus-storage CDN paths). Run with: node scripts/generate-images.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, '..', 'public');
const productDir = resolve(publicDir, 'img', 'products');
mkdirSync(productDir, { recursive: true });

const DEEP = '#164743';
const DEEP2 = '#103a37';
const LEAF = '#648b74';
const CORAL = '#df7955';
const GOLD = '#e9b959';
const CREAM = '#f1eee4';

// id, label, accent colour, silhouette key
const products = [
  ['black-pomfret', 'Black Pomfret', GOLD, 'fish'],
  ['surmai', 'Surmai', LEAF, 'fish'],
  ['rawas', 'Rawas', LEAF, 'fish'],
  ['tiger-prawns', 'Tiger Prawns', CORAL, 'prawn'],
  ['mud-crab', 'Mud Crab', CORAL, 'crab'],
  ['bombil', 'Dried Bombil', GOLD, 'dried'],
  ['surmai-curry-cut', 'Curry Cut', LEAF, 'pieces'],
  ['dry-prawns', 'Dried Prawns', GOLD, 'dried'],
];

function silhouette(kind) {
  if (kind === 'prawn') {
    return `<path d="M150 300c30-70 90-120 150-120 40 0 60 20 70 40 10 20 40 20 50 0 10-20 30-40 70-40 60 0 120 50 150 120-30 60-90 100-150 100-40 0-60-16-70-34-10-18-40-18-50 0-10 18-30 34-70 34-60 0-120-40-150-100z" fill="rgba(255,255,255,.9)"/><circle cx="520" cy="285" r="8" fill="${DEEP2}"/><circle cx="180" cy="285" r="8" fill="${DEEP2}"/>`;
  }
  if (kind === 'crab') {
    return `<ellipse cx="350" cy="300" rx="150" ry="100" fill="rgba(255,255,255,.92)"/><circle cx="250" cy="230" r="14" fill="${DEEP2}"/><circle cx="450" cy="230" r="14" fill="${DEEP2}"/><path d="M210 200c-40-30-70-30-90-10M490 200c40-30 70-30 90-10" stroke="rgba(255,255,255,.92)" stroke-width="16" fill="none" stroke-linecap="round"/><path d="M230 380l-40 60M470 380l40 60M280 390l-20 70M420 390l20 70" stroke="rgba(255,255,255,.8)" stroke-width="14" fill="none" stroke-linecap="round"/>`;
  }
  if (kind === 'dried') {
    return `<path d="M180 300c40-40 90-60 140-60s90 20 120 60c-30 50-80 80-130 80s-100-30-130-80z" fill="rgba(255,255,255,.9)"/><path d="M300 300l90-40-10 80z" fill="rgba(255,255,255,.9)"/><circle cx="230" cy="290" r="7" fill="${DEEP2}"/><path d="M150 360c60 30 90 30 150 0" stroke="${GOLD}" stroke-width="6" fill="none" opacity=".7"/>`;
  }
  if (kind === 'pieces') {
    return `<g fill="rgba(255,255,255,.92)"><rect x="200" y="240" width="130" height="80" rx="26" transform="rotate(-12 265 280)"/><rect x="330" y="250" width="130" height="80" rx="26" transform="rotate(8 395 290)"/><rect x="260" y="310" width="130" height="80" rx="26" transform="rotate(-4 325 350)"/></g><circle cx="248" cy="272" r="6" fill="${DEEP2}"/><circle cx="470" cy="300" r="6" fill="${DEEP2}"/>`;
  }
  // fish (default)
  return `<path d="M170 300c60-90 160-130 250-130 70 0 120 40 150 130-30 90-80 130-150 130-90 0-190-40-250-130z" fill="rgba(255,255,255,.92)"/><path d="M570 300l90-60v120z" fill="rgba(255,255,255,.92)"/><circle cx="245" cy="278" r="10" fill="${DEEP2}"/><path d="M300 320c40 20 80 20 120 0" stroke="${DEEP2}" stroke-width="6" fill="none" opacity=".25"/>`;
}

function productSvg(label, accent, kind) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="700" height="560" viewBox="0 0 700 560" role="img" aria-label="${label}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${DEEP}"/>
      <stop offset="1" stop-color="${DEEP2}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.42" r="0.6">
      <stop offset="0" stop-color="${accent}" stop-opacity="0.28"/>
      <stop offset="1" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="700" height="560" fill="url(#bg)"/>
  <rect width="700" height="560" fill="url(#glow)"/>
  <circle cx="350" cy="300" r="188" fill="none" stroke="rgba(255,255,255,.16)" stroke-width="2"/>
  <circle cx="350" cy="300" r="150" fill="rgba(255,255,255,.05)"/>
  ${silhouette(kind)}
  <text x="40" y="512" font-family="Georgia, 'Times New Roman', serif" font-size="40" fill="${CREAM}">${label}</text>
  <text x="42" y="540" font-family="Helvetica, Arial, sans-serif" font-size="15" fill="${accent}" letter-spacing="3">KOLFRESH · FRESH</text>
</svg>`;
}

for (const [id, label, accent, kind] of products) {
  writeFileSync(resolve(productDir, `${id}.svg`), productSvg(label, accent, kind), 'utf8');
}

const hero = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1000" viewBox="0 0 900 1000" role="img" aria-label="Fresh coastal seafood on crushed ice">
  <defs>
    <linearGradient id="hbg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${DEEP}"/>
      <stop offset="1" stop-color="${DEEP2}"/>
    </linearGradient>
    <radialGradient id="hglow" cx="0.5" cy="0.4" r="0.65">
      <stop offset="0" stop-color="${GOLD}" stop-opacity="0.3"/>
      <stop offset="1" stop-color="${GOLD}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="900" height="1000" fill="url(#hbg)"/>
  <rect width="900" height="1000" fill="url(#hglow)"/>
  <g opacity="0.5" fill="rgba(255,255,255,.25)">
    <circle cx="180" cy="760" r="26"/><circle cx="260" cy="800" r="18"/><circle cx="700" cy="720" r="22"/><circle cx="760" cy="790" r="14"/>
  </g>
  <circle cx="450" cy="440" r="250" fill="none" stroke="rgba(255,255,255,.16)" stroke-width="2"/>
  <circle cx="450" cy="440" r="205" fill="rgba(255,255,255,.05)"/>
  <g transform="translate(450 440) scale(1.25)">
    <path d="M-180 0c60-90 160-130 250-130 70 0 120 40 150 130-30 90-80 130-150 130-90 0-190-40-250-130z" fill="rgba(255,255,255,.94)"/>
    <path d="M220 0l90-60v120z" fill="rgba(255,255,255,.94)"/>
    <circle cx="-105" cy="-22" r="11" fill="${DEEP2}"/>
    <path d="M-50 20c40 20 80 20 120 0" stroke="${DEEP2}" stroke-width="6" fill="none" opacity=".22"/>
  </g>
  <text x="70" y="900" font-family="Georgia, serif" font-size="46" fill="${CREAM}">Catch today.</text>
  <text x="70" y="952" font-family="Georgia, serif" font-size="46" fill="${GOLD}">Cook tomorrow.</text>
</svg>`;
writeFileSync(resolve(publicDir, 'img', 'hero.svg'), hero, 'utf8');

console.log(`Generated ${products.length} product tiles + hero in public/img`);

