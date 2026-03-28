import { getTimeWord } from "@/lib/getTimeWord";

async function word(key: string, fallback: string) {
  const v = await getTimeWord(key, "en");
  return v || fallback;
}

export async function formatEnglishTime(date: Date): Promise<string> {
  const h = date.getHours();
  const m = date.getMinutes();

  const hour = h % 12 === 0 ? 12 : h % 12;
  const nextHour = (h + 1) % 12 === 0 ? 12 : (h + 1) % 12;

  const hourWord = await word(`hour_${hour}`, String(hour));
  const nextHourWord = await word(`hour_${nextHour}`, String(nextHour));

  // exact
  if (m === 0) return `${hourWord} o'clock`;

  // 🔥 NATURAL FIRST !!!
  if (m >= 3 && m <= 7) {
    return `just after ${hourWord}`;
  }

  if (m >= 53 && m <= 57) {
    return `almost ${nextHourWord}`;
  }

  // quarter / half
  if (m === 15) return `quarter past ${hourWord}`;
  if (m === 30) return `half past ${hourWord}`;
  if (m === 45) return `quarter to ${nextHourWord}`;

  // normal logic
  if (m < 30) {
    const minute = await word(`min_${m}`, String(m));
    return `${minute} past ${hourWord}`;
  }

  const rest = 60 - m;
  const minute = await word(`min_${rest}`, String(rest));
  return `${minute} to ${nextHourWord}`;
}