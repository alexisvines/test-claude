/**
 * Creates minimal valid PNG icons using deflate compression.
 * Pure Node.js, no external dependencies.
 */
import zlib from 'zlib'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

// Simple CRC32
const CRC_TABLE = new Uint32Array(256)
for (let i = 0; i < 256; i++) {
  let c = i
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1
  }
  CRC_TABLE[i] = c
}

function crc32(buf) {
  let c = 0xFFFFFFFF
  for (const byte of buf) {
    c = CRC_TABLE[(c ^ byte) & 0xFF] ^ (c >>> 8)
  }
  return (c ^ 0xFFFFFFFF) >>> 0
}

function makeChunk(type, data) {
  const typeBuffer = Buffer.from(type, 'ascii')
  const lenBuf = Buffer.alloc(4)
  lenBuf.writeUInt32BE(data.length, 0)
  const crc = crc32(Buffer.concat([typeBuffer, data]))
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc, 0)
  return Buffer.concat([lenBuf, typeBuffer, data, crcBuf])
}

function createPNG(size) {
  const bg = [6, 6, 6]        // #060606
  const accent = [200, 255, 0] // #C8FF00
  const dark = [20, 20, 20]    // plate shadow

  const pixels = []
  for (let y = 0; y < size; y++) {
    pixels.push(0) // PNG filter: None
    for (let x = 0; x < size; x++) {
      const nx = x / size
      const ny = y / size

      // Rounded rectangle background
      const margin = 0.05
      const radius = 0.18
      let inBg = nx > margin && nx < 1 - margin && ny > margin && ny < 1 - margin

      // Barbell shape
      const barY = ny >= 0.44 && ny <= 0.56  // horizontal bar
      const leftPlate = nx >= 0.07 && nx <= 0.25 && ny >= 0.28 && ny <= 0.72
      const rightPlate = nx >= 0.75 && nx <= 0.93 && ny >= 0.28 && ny <= 0.72
      const bar = barY && nx >= 0.25 && nx <= 0.75

      let color
      if (!inBg) {
        color = bg
      } else if (leftPlate || rightPlate || bar) {
        color = accent
      } else {
        color = dark
      }

      pixels.push(...color)
    }
  }

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8  // bit depth
  ihdr[9] = 2  // RGB color type
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0

  const raw = Buffer.from(pixels)
  const compressed = zlib.deflateSync(raw)

  const ihdrChunk = makeChunk('IHDR', ihdr)
  const idatChunk = makeChunk('IDAT', compressed)
  const iendChunk = makeChunk('IEND', Buffer.alloc(0))

  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk])
}

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]
const iconsDir = join(process.cwd(), 'public', 'icons')
mkdirSync(iconsDir, { recursive: true })

for (const size of sizes) {
  const png = createPNG(size)
  writeFileSync(join(iconsDir, `icon-${size}.png`), png)
  console.log(`✓ icon-${size}.png (${(png.length / 1024).toFixed(1)} KB)`)
}

console.log('\n✅ PWA icons ready!')
