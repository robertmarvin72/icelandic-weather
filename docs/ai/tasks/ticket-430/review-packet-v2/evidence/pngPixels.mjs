// Minimal PNG decoder for 8-bit RGBA (colorType 6), non-interlaced PNGs —
// exactly what Playwright's page/element screenshots produce. No new
// dependency: uses only Node's built-in zlib. Not a general-purpose decoder
// (no palette/interlace/16-bit support) — sufficient for this evidence
// harness's own screenshots only.
import zlib from "node:zlib";

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

export function decodePng(buffer) {
  if (!buffer.subarray(0, 8).equals(SIGNATURE)) throw new Error("not a PNG");
  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idatChunks = [];

  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data.readUInt8(8);
      colorType = data.readUInt8(9);
      const interlace = data.readUInt8(12);
      if (interlace !== 0) throw new Error("interlaced PNG not supported");
    } else if (type === "IDAT") {
      idatChunks.push(data);
    } else if (type === "IEND") {
      break;
    }
    offset += 8 + length + 4; // length + type + data + crc
  }

  if (bitDepth !== 8 || (colorType !== 6 && colorType !== 2)) {
    throw new Error(`unsupported PNG format: bitDepth=${bitDepth} colorType=${colorType}`);
  }
  const channels = colorType === 6 ? 4 : 3;
  const raw = zlib.inflateSync(Buffer.concat(idatChunks));

  const bytesPerPixel = channels;
  const stride = width * bytesPerPixel;
  const out = Buffer.alloc(height * stride);

  let rawOffset = 0;
  for (let y = 0; y < height; y++) {
    const filterType = raw[rawOffset];
    rawOffset += 1;
    const rowStart = y * stride;
    const prevRowStart = (y - 1) * stride;
    for (let x = 0; x < stride; x++) {
      const raw_x = raw[rawOffset + x];
      const a = x >= bytesPerPixel ? out[rowStart + x - bytesPerPixel] : 0;
      const b = y > 0 ? out[prevRowStart + x] : 0;
      const c = y > 0 && x >= bytesPerPixel ? out[prevRowStart + x - bytesPerPixel] : 0;
      let value;
      switch (filterType) {
        case 0:
          value = raw_x;
          break;
        case 1:
          value = (raw_x + a) & 0xff;
          break;
        case 2:
          value = (raw_x + b) & 0xff;
          break;
        case 3:
          value = (raw_x + Math.floor((a + b) / 2)) & 0xff;
          break;
        case 4:
          value = (raw_x + paeth(a, b, c)) & 0xff;
          break;
        default:
          throw new Error(`unsupported PNG filter type ${filterType}`);
      }
      out[rowStart + x] = value;
    }
    rawOffset += stride;
  }

  return {
    width,
    height,
    channels,
    getPixel(x, y) {
      const i = y * stride + x * bytesPerPixel;
      return channels === 4 ? [out[i], out[i + 1], out[i + 2], out[i + 3]] : [out[i], out[i + 1], out[i + 2], 255];
    },
  };
}
