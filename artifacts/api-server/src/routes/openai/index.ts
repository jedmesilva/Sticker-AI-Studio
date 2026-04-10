import { Router, type IRouter } from "express";
import { generateImageBuffer } from "@workspace/integrations-openai-ai-server/image";
import { GenerateOpenaiImageBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/openai/generate-image", async (req, res): Promise<void> => {
  const parsed = GenerateOpenaiImageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { prompt, size } = parsed.data;

  const validSize = (size as "1024x1024" | "512x512" | "256x256") ?? "1024x1024";
  const buffer = await generateImageBuffer(
    `A cute sticker of: ${prompt}. Sticker style, white background, clean edges, vibrant colors, cartoon illustration, high quality`,
    validSize
  );

  res.json({ b64_json: buffer.toString("base64") });
});

export default router;
