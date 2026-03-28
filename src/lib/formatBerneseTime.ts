import { getTimeWord } from "@/lib/getTimeWord";

async function safeTimeWord(
  key: string,
  fallback: string,
  language?: string
): Promise<string> {
  const value = await getTimeWord(key, language);
  return value?.trim() ? value : fallback;
}

async function getHourWord(hour: number, language?: string): Promise<string> {
  const normalizedHour = ((hour % 24) + 24) % 24;
  return safeTimeWord(`hour_${normalizedHour}`, String(normalizedHour), language);
}

export async function formatBerneseTime(
  date: Date,
  language?: string
): Promise<string> {
  const h = date.getHours();
  const m = date.getMinutes();
  const nextHour = (h + 1) % 24;

  const currentHourWord = await getHourWord(h, language);
  const nextHourWord = await getHourWord(nextHour, language);

  if (m < 5) {
    return `${currentHourWord} ${await safeTimeWord("exact", "genau", language)}`;
  }

  if (m < 10) {
    return `${await safeTimeWord("plus_5", "füf ab", language)} ${currentHourWord}`;
  }

  if (m < 15) {
    return `${await safeTimeWord("plus_10", "zäh ab", language)} ${currentHourWord}`;
  }

  if (m < 20) {
    return `${await safeTimeWord("quarter_past", "viertu ab", language)} ${currentHourWord}`;
  }

  if (m < 25) {
    return `${await safeTimeWord("twenty_past", "zwänzg ab", language)} ${currentHourWord}`;
  }

  if (m < 30) {
    return `${await safeTimeWord("five_before_half", "füf vor haubi", language)} ${nextHourWord}`;
  }

  if (m < 35) {
    return `${await safeTimeWord("half", "haubi", language)} ${nextHourWord}`;
  }

  if (m < 40) {
    return `${await safeTimeWord("five_after_half", "füf ab haubi", language)} ${nextHourWord}`;
  }

  if (m < 45) {
    return `${await safeTimeWord("twenty_to", "zwänzg vor", language)} ${nextHourWord}`;
  }

  if (m < 50) {
    return `${await safeTimeWord("quarter_to", "viertu vor", language)} ${nextHourWord}`;
  }

  if (m < 55) {
    return `${await safeTimeWord("ten_to", "zäh vor", language)} ${nextHourWord}`;
  }

  return `${await safeTimeWord("five_to", "füf vor", language)} ${nextHourWord}`;
}