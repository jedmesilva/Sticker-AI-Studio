import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, stickersTable } from "@workspace/db";
import {
  CreateStickerBody,
  DeleteStickerParams,
  GetRecentStickersQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/stickers", async (_req, res): Promise<void> => {
  const stickers = await db
    .select()
    .from(stickersTable)
    .orderBy(desc(stickersTable.createdAt));
  res.json(stickers);
});

router.post("/stickers", async (req, res): Promise<void> => {
  const parsed = CreateStickerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [sticker] = await db
    .insert(stickersTable)
    .values({
      prompt: parsed.data.prompt,
      imageData: parsed.data.imageData,
    })
    .returning();

  res.status(201).json(sticker);
});

router.get("/stickers/recent", async (req, res): Promise<void> => {
  const parsed = GetRecentStickersQueryParams.safeParse(req.query);
  const limit = parsed.success && parsed.data.limit ? parsed.data.limit : 12;

  const stickers = await db
    .select()
    .from(stickersTable)
    .orderBy(desc(stickersTable.createdAt))
    .limit(limit);

  res.json(stickers);
});

router.delete("/stickers/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteStickerParams.safeParse({ id: parseInt(rawId, 10) });

  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(stickersTable)
    .where(eq(stickersTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Sticker not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
