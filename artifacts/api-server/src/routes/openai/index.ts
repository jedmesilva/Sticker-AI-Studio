import { Router, type IRouter } from "express";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { generateImageBuffer, editImages } from "@workspace/integrations-openai-ai-server/image";
import { GenerateOpenaiImageBody } from "@workspace/api-zod";

const router: IRouter = Router();

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
    buffer = await generateImageBuffer(stickerPrompt, "1024x1024");
  }

  res.json({ b64_json: buffer.toString("base64") });
});

export default router;
