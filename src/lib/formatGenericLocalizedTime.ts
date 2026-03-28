import { getTimeWord } from "@/lib/getTimeWord";

async function safeTimeWord(
  key: string,
  fallback: string,
  language: string
): Promise<string> {
  const value = await getTimeWord(key, language);
  return value?.trim() ? value : fallback;
}

async function minuteWord(minute: number, language: string): Promise<string> {
  return safeTimeWord(`min_${minute}`, String(minute), language);
}

async function hourWord(hour: number, language: string): Promise<string> {
  const normalizedHour = ((hour % 24) + 24) % 24;
  const hour12 = normalizedHour % 12 === 0 ? 12 : normalizedHour % 12;

  // Deutsch soll keine Spezialwörter wie "Mittag" oder "Nacht" bekommen
  if (language === "de") {
    return String(hour12);
  }

  return safeTimeWord(`hour_${hour12}`, String(hour12), language);
}

export async function formatGenericLocalizedTime(
  date: Date,
  language: string
): Promise<string> {
  const h = date.getHours();
  const m = date.getMinutes();
  const nextHour = (h + 1) % 24;

  if (m === 0) {
    const currentHour = await hourWord(h, language);
    const exact = await safeTimeWord("exact", "o'clock", language);
    return `${currentHour} ${exact}`;
  }

  if (m === 15) {
    const currentHour = await hourWord(h, language);
    const quarterPast = await safeTimeWord(
      "quarter_past",
      "quarter past",
      language
    );
    return `${quarterPast} ${currentHour}`;
  }

  if (m === 30) {
    const half = await safeTimeWord("half", "half past", language);

    // Deutsch: halb zwölf, nicht halb elf
    if (language === "de") {
      const nextHourWord = await hourWord(nextHour, language);
      return `${half} ${nextHourWord}`;
    }

    const currentHour = await hourWord(h, language);
    return `${half} ${currentHour}`;
  }

  if (m === 45) {
    const nextHourWord = await hourWord(nextHour, language);
    const quarterTo = await safeTimeWord(
      "quarter_to",
      "quarter to",
      language
    );
    return `${quarterTo} ${nextHourWord}`;
  }

  if (m < 30) {
    const currentHour = await hourWord(h, language);
    const minute = await minuteWord(m, language);
    const past = await safeTimeWord("past", "past", language);
    return `${minute} ${past} ${currentHour}`;
  }

  // Deutsch: z. B. fünf nach halb zwölf
  if (language === "de") {
    const nextHourWord = await hourWord(nextHour, language);
    const minuteAfterHalf = m - 30;
    const minute = await minuteWord(minuteAfterHalf, language);
    const afterHalf = await safeTimeWord("after_half", "nach halb", language);
    return `${minute} ${afterHalf} ${nextHourWord}`;
  }

  const nextHourWord = await hourWord(nextHour, language);
  const remainingMinutes = 60 - m;
  const minute = await minuteWord(remainingMinutes, language);
  const to = await safeTimeWord("to", "to", language);

  return `${minute} ${to} ${nextHourWord}`;
}