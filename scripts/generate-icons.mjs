// Script to generate PWA icons as simple SVG-based PNGs
// Run: node scripts/generate-icons.mjs
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]
const iconsDir = join(process.cwd(), 'public', 'icons')

mkdirSync(iconsDir, { recursive: true })

// Generate a simple SVG icon for each size
for (const size of sizes) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="#060606"/>
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#bg)"/>
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1a1a1a"/>
      <stop offset="100%" stop-color="#060606"/>
    </linearGradient>
  </defs>
  <!-- Barbell icon -->
  <g transform="translate(${size * 0.1}, ${size * 0.3})">
    <!-- Bar -->
    <rect x="${size * 0.15}" y="${size * 0.18}" width="${size * 0.5}" height="${size * 0.04}" rx="${size * 0.02}" fill="#C8FF00"/>
    <!-- Left weight -->
    <rect x="${size * 0.05}" y="${size * 0.08}" width="${size * 0.1}" height="${size * 0.24}" rx="${size * 0.03}" fill="#C8FF00"/>
    <!-- Right weight -->
    <rect x="${size * 0.65}" y="${size * 0.08}" width="${size * 0.1}" height="${size * 0.24}" rx="${size * 0.03}" fill="#C8FF00"/>
    <!-- Clamps -->
    <rect x="${size * 0.14}" y="${size * 0.12}" width="${size * 0.02}" height="${size * 0.16}" rx="${size * 0.01}" fill="#8C8C8C"/>
    <rect x="${size * 0.64}" y="${size * 0.12}" width="${size * 0.02}" height="${size * 0.16}" rx="${size * 0.01}" fill="#8C8C8C"/>
  </g>
  <!-- "OS" text -->
  <text x="${size * 0.5}" y="${size * 0.82}" text-anchor="middle" font-family="'Arial Black', Arial, sans-serif" font-weight="900" font-size="${size * 0.16}" fill="#C8FF00" letter-spacing="-0.5">GymOS</text>
</svg>`

  writeFileSync(join(iconsDir, `icon-${size}.svg`), svg)
  console.log(`Generated icon-${size}.svg`)
}

// Also create a simple favicon
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="#060606"/>
  <rect x="3" y="14" width="26" height="4" rx="2" fill="#C8FF00"/>
  <rect x="3" y="10" width="6" height="12" rx="2" fill="#C8FF00"/>
  <rect x="23" y="10" width="6" height="12" rx="2" fill="#C8FF00"/>
</svg>`

writeFileSync(join(process.cwd(), 'public', 'favicon.svg'), faviconSvg)
console.log('Generated favicon.svg')
console.log('\nNote: For production, convert SVGs to PNGs using a tool like svgexport or sharp.')
console.log('For development, the app works with SVG icons.')
