import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const stickersTable = pgTable("stickers", {
  id: serial("id").primaryKey(),
  userId: text("user_id"),
  prompt: text("prompt").notNull(),
  imageData: text("image_data").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertStickerSchema = createInsertSchema(stickersTable).omit({ id: true, createdAt: true });
export type InsertSticker = z.infer<typeof insertStickerSchema>;
export type Sticker = typeof stickersTable.$inferSelect;
