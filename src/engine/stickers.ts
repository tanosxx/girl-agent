import { promises as fs } from "node:fs";
import path from "node:path";
import type { ProfileConfig } from "../types.js";
import { profileDir, readMd, writeMd } from "../storage/md.js";

export interface StickerChoice {
  fileId: string;
  emoji?: string;
  tags?: string[];
}

const DEFAULT_LIBRARY = `# sticker library
# Добавляй по одному file_id на строку:
# CAACAgIAAxkBAA... | 😂 | laugh,funny
`;

async function libraryPath(cfg: ProfileConfig): Promise<string> {
  const rel = "stickers/library.md";
  const current = await readMd(cfg.slug, rel);
  if (!current.trim()) await writeMd(cfg.slug, rel, DEFAULT_LIBRARY);
  return path.join(profileDir(cfg.slug), rel);
}

export async function listStickers(cfg: ProfileConfig): Promise<StickerChoice[]> {
  await libraryPath(cfg);
  const raw = await readMd(cfg.slug, "stickers/library.md");
  return raw.split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l && !l.startsWith("#"))
    .map(line => {
      const [fileId = "", emoji, tagsRaw] = line.split("|").map(x => x.trim());
      return { fileId, emoji, tags: tagsRaw ? tagsRaw.split(",").map(x => x.trim()).filter(Boolean) : [] };
    })
    .filter(s => s.fileId.length > 8);
}

export async function pickSticker(cfg: ProfileConfig, mood = ""): Promise<StickerChoice | undefined> {
  const stickers = await listStickers(cfg);
  if (!stickers.length) return undefined;
  const q = mood.toLowerCase();
  const tagged = stickers.filter(s => s.tags?.some(t => q.includes(t.toLowerCase())) || (s.emoji && q.includes(s.emoji)));
  const pool = tagged.length ? tagged : stickers;
  return pool[Math.floor(Math.random() * pool.length)];
}

export async function addStickerToLibrary(cfg: ProfileConfig, fileId: string, emoji = "", tags: string[] = []): Promise<void> {
  await libraryPath(cfg);
  const existing = await listStickers(cfg);
  if (existing.some(s => s.fileId === fileId)) return;
  const p = path.join(profileDir(cfg.slug), "stickers/library.md");
  await fs.appendFile(p, `${fileId} | ${emoji} | ${tags.join(",")}\n`, "utf8");
}
