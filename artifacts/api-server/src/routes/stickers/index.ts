import { Router, type IRouter } from "express";
import { supabase } from "../../lib/supabase";
import {
  CreateStickerBody,
  DeleteStickerParams,
  GetRecentStickersQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/stickers", async (_req, res): Promise<void> => {
  const { data, error } = await supabase
    .from("stickers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  const stickers = (data ?? []).map((s) => ({
    id: s.id,
    prompt: s.prompt,
    imageData: s.image_data,
    createdAt: s.created_at,
  }));

  res.json(stickers);
});

router.post("/stickers", async (req, res): Promise<void> => {
  const parsed = CreateStickerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { data, error } = await supabase
    .from("stickers")
    .insert({ prompt: parsed.data.prompt, image_data: parsed.data.imageData })
    .select()
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.status(201).json({
    id: data.id,
    prompt: data.prompt,
    imageData: data.image_data,
    createdAt: data.created_at,
  });
});

router.get("/stickers/recent", async (req, res): Promise<void> => {
  const parsed = GetRecentStickersQueryParams.safeParse(req.query);
  const limit = parsed.success && parsed.data.limit ? parsed.data.limit : 12;

  const { data, error } = await supabase
    .from("stickers")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  const stickers = (data ?? []).map((s) => ({
    id: s.id,
    prompt: s.prompt,
    imageData: s.image_data,
    createdAt: s.created_at,
  }));

  res.json(stickers);
});

router.delete("/stickers/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteStickerParams.safeParse({ id: parseInt(rawId, 10) });

  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { data, error } = await supabase
    .from("stickers")
    .delete()
    .eq("id", params.data.id)
    .select()
    .single();

  if (error) {
    res.status(404).json({ error: "Sticker not found" });
    return;
  }

  if (!data) {
    res.status(404).json({ error: "Sticker not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
