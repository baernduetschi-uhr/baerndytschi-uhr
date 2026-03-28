import { getTimeWord } from "@/lib/getTimeWord";

async function minuteWord(minute: number): Promise<string> {
  const value = await getTimeWord(`min_${minute}`, "de");
  return value?.trim() ? value : String(minute);
}

function numericHourWord(hour24: number): string {
  const normalizedHour = ((hour24 % 24) + 24) % 24;
  const hour12 = normalizedHour % 12 === 0 ? 12 : normalizedHour % 12;
  return String(hour12);
}

export async function formatGermanTime(date: Date): Promise<string> {
  const h = date.getHours();
  const m = date.getMinutes();

  const hourWord = numericHourWord(h);
  const nextHourWord = numericHourWord(h + 1);

  // volle Stunde
  if (m === 0) return `${hourWord} Uhr`;

  // natürliche Näherungen
  if (m >= 3 && m <= 7) return `kurz nach ${hourWord}`;
  if (m >= 53 && m <= 57) return `kurz vor ${nextHourWord}`;

  // Viertel / Halb / Viertel vor
  if (m === 15) return `Viertel nach ${hourWord}`;
  if (m === 30) return `halb ${nextHourWord}`;
  if (m === 45) return `Viertel vor ${nextHourWord}`;

  // Nähe zu Viertel / Halb
  if (m >= 13 && m <= 17) return `Viertel nach ${hourWord}`;
  if (m >= 28 && m <= 32) return `halb ${nextHourWord}`;
  if (m >= 43 && m <= 47) return `Viertel vor ${nextHourWord}`;

  // vor halb / nach halb / vor
  if (m < 30) {
    if (m === 20) return `zwanzig nach ${hourWord}`;
    if (m === 25) return `fünf vor halb ${nextHourWord}`;

    return `${await minuteWord(m)} nach ${hourWord}`;
  }

  if (m > 30) {
    if (m === 35) return `fünf nach halb ${nextHourWord}`;
    if (m === 40) return `zwanzig vor ${nextHourWord}`;

    const minuteAfterHalf = m - 30;
    return `${await minuteWord(minuteAfterHalf)} nach halb ${nextHourWord}`;
  }

  return `${hourWord}:${m}`;
}