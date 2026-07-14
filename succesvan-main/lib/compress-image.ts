// lib/compress-image.ts
import sharp from "sharp";

const MAX_SIZE = 100 * 1024; // 100KB

export async function compressImageToTarget(buffer: Buffer): Promise<Buffer> {
  let quality = 80;
  let width = 1792; // initial (your DALL-E size)

  let output: Buffer = buffer;

  while (true) {
    output = await sharp(buffer)
      .resize({ width }) // auto height
      .webp({ quality })
      .toBuffer();

    if (output.length <= MAX_SIZE) {
      return output;
    }

    // reduce quality first
    if (quality > 40) {
      quality -= 10;
    }
    // then reduce dimensions
    else if (width > 800) {
      width -= 200;
      quality = 70; // reset a bit after resize
    } else {
      // last fallback, return best effort
      return output;
    }
  }
}
