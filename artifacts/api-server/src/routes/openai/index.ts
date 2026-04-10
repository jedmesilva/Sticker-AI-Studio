import { Router, type IRouter } from "express";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import { openai, editImages } from "@workspace/integrations-openai-ai-server/image";
import { GenerateOpenaiImageBody } from "@workspace/api-zod";

const router: IRouter = Router();

/**
 * Flood-fill background removal starting from image corners.
 * Pixels connected to the corners that are within `threshold` color distance
 * from the corner's color are made fully transparent.
 */
async function removeBackground(buffer: Buffer, threshold = 35): Promise<Buffer> {
  const img = sharp(buffer).ensureAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const pixels = Buffer.from(data);

  const getPixel = (idx: number) => ({
    r: pixels[idx * 4],
    g: pixels[idx * 4 + 1],
    b: pixels[idx * 4 + 2],
    a: pixels[idx * 4 + 3],
  });

  // Sample background color from all four corners and pick the most common hue
  const corner = getPixel(0);

  const colorDist = (idx: number) => {
    const p = getPixel(idx);
    return Math.abs(p.r - corner.r) + Math.abs(p.g - corner.g) + Math.abs(p.b - corner.b);
  };

  const visited = new Uint8Array(width * height);

  // Seed queue with all four corners
  const queue: number[] = [];
  const seeds = [0, width - 1, (height - 1) * width, height * width - 1];
  for (const s of seeds) {
    if (!visited[s] && colorDist(s) < threshold * 3) {
      visited[s] = 1;
      queue.push(s);
    }
  }

  let head = 0;
  while (head < queue.length) {
    const idx = queue[head++];
    // Make transparent
    pixels[idx * 4 + 3] = 0;

    const x = idx % width;
    const y = Math.floor(idx / width);

    const neighbors = [
      y > 0 ? idx - width : -1,
      y < height - 1 ? idx + width : -1,
      x > 0 ? idx - 1 : -1,
      x < width - 1 ? idx + 1 : -1,
    ];

    for (const n of neighbors) {
      if (n >= 0 && !visited[n] && colorDist(n) < threshold * 3) {
        visited[n] = 1;
        queue.push(n);
      }
    }
  }

  return sharp(pixels, { raw: { width, height, channels: 4 } })
    .png()
    .toBuffer();
}

router.post("/openai/generate-image", async (req, res): Promise<void> => {
  const parsed = GenerateOpenaiImageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { prompt, referenceImageData } = parsed.data;
  const stickerPrompt = `A cute sticker of: ${prompt}. Sticker style, clean edges, vibrant colors, cartoon illustration, high quality`;

  let buffer: Buffer;

  if (referenceImageData) {
    const tmpFile = path.join(os.tmpdir(), `ref-${Date.now()}.png`);
    try {
      fs.writeFileSync(tmpFile, Buffer.from(referenceImageData, "base64"));
      buffer = await editImages([tmpFile], stickerPrompt);
    } finally {
      try { fs.unlinkSync(tmpFile); } catch {}
    }
  } else {
    const response = await openai.images.generate({
      model: "gpt-image-1",
      prompt: stickerPrompt,
      size: "1024x1024",
    });
    const base64 = response.data[0]?.b64_json ?? "";
    buffer = Buffer.from(base64, "base64");
  }

  // Remove background (works regardless of whether the API returned transparency)
  const transparent = await removeBackground(buffer);

  res.json({ b64_json: transparent.toString("base64") });
});

export default router;
