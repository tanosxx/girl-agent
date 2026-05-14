import type { ChatContentPart } from "../llm/index.js";
import type { IncomingMedia } from "../telegram/index.js";

const REFUSALS: Record<string, string[]> = {
  photo: ["не хочу фоткаться ща", "не, фото не буду", "я щас не в виде", "потом может", "отстань с фотками"],
  video: ["не хочу видео", "не, не буду снимать", "мне лень", "не сейчас", "я не в настроении"],
  voice: ["не хочу голосом", "не, голосовые не ща", "я не могу щас говорить", "пиши текстом", "мне неудобно голосом"],
  video_note: ["кружочки не хочу", "не буду кружок снимать", "не, я щас не в виде", "потом может", "мне лень кружок"],
  sticker: ["ахах", "мда", "))", "жесть", "ну ты"],
  document: ["что это", "я не буду открывать", "скинь нормально", "не хочу файл смотреть"]
};

export function outgoingMediaRefusal(kind: keyof typeof REFUSALS): string {
  const list = REFUSALS[kind] ?? REFUSALS.document;
  return list[Math.floor(Math.random() * list.length)] ?? "не хочу";
}

export function describeIncomingMedia(media?: IncomingMedia): string {
  if (!media) return "";
  const base = media.kind === "photo" ? "[он прислал фото]"
    : media.kind === "video" ? "[он прислал видео]"
    : media.kind === "voice" ? "[он прислал голосовое]"
    : media.kind === "video_note" ? "[он прислал кружочек]"
    : media.kind === "sticker" ? `[он прислал стикер${media.emoji ? ` ${media.emoji}` : ""}]`
    : "[он прислал файл]";
  return media.caption ? `${base}: ${media.caption}` : base;
}

export function mediaPromptFragment(media?: IncomingMedia): string {
  if (!media) return "";
  if (media.kind === "photo") return "# Входящее фото\nОн прислал фото. Если модель видит картинку — реагируй на конкретику фото, коротко и по-человечески. Не говори, что анализируешь изображение. Если фото непонятное — скажи естественно.\n\n# Обнаружение мемов без поиска\nПроверь, узнаёшь ли ты фото как известный интернет-мем, мем-шаблон, вирусную картинку или устойчивую поп-культурную визуальную отсылку. Это НЕ reverse image search: используй только свои визуальные знания. Упоминай мем/отсылку только при высокой уверенности. Если есть сомнение — считай это обычным фото и не называй мемом.";
  if (media.kind === "voice") return "# Входящее голосовое\nОн прислал голосовое. Если нет расшифровки, реагируй как человек, которому неудобно слушать: попроси текстом или отмахнись.";
  if (media.kind === "video_note") return "# Входящий кружочек\nОн прислал кружочек. Не обещай отправить кружок в ответ. Можешь лениво/смущённо отреагировать.";
  if (media.kind === "video") return "# Входящее видео\nОн прислал видео. Реагируй осторожно; не притворяйся, что видела детали, если они не переданы модели.";
  if (media.kind === "sticker") return "# Входящий стикер\nОн прислал стикер. Если модель видит изображение стикера — реагируй на конкретную эмоцию/картинку, а не только на emoji. Можно ответить реакцией/короткой репликой или тоже стикером, если уместно. Если это известный мемный стикер/персонаж — учитывай это только при высокой уверенности, без угадывания.";
  return "# Входящий файл\nОн прислал файл. Не открывай и не обещай смотреть подробно, если содержимое не передано.";
}

export function memeDetectionInstruction(media?: IncomingMedia): string {
  if (!media || (media.kind !== "photo" && media.kind !== "sticker")) return "";
  return "Проверь, узнаёшь ли изображение как известный мем/мем-шаблон/вирусную картинку. Если уверен — учти это как контекст для ответа. Если не уверен — не называй мемом и отвечай как на обычное изображение.";
}

export function imagePartFromMedia(media?: IncomingMedia): ChatContentPart | undefined {
  if (!media || (media.kind !== "photo" && media.kind !== "sticker") || !media.mimeType || !media.base64) return undefined;
  return {
    type: "image",
    mimeType: media.mimeType,
    data: media.base64
  };
}
