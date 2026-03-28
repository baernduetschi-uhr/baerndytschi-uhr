import { getTranslation } from "@/lib/getTranslation";
import { getLanguageRule } from "@/lib/getLanguageRule";
import { formatBerneseYear } from "@/src/lib/formatBerneseYear";

const weekdayKeys = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

const monthKeys = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
] as const;

function safeValue(value: string | null | undefined, fallback: string): string {
  return value?.trim() ? value : fallback;
}

export async function formatLocalizedDate(
  date: Date,
  language?: string
): Promise<string> {
  const activeLanguage = language ?? "bern";
  const rule = await getLanguageRule(activeLanguage);

  const weekdayKey = weekdayKeys[date.getDay()];
  const monthKey = monthKeys[date.getMonth()];
  const dayKey = String(date.getDate());

  const weekdayRaw = await getTranslation("weekday", weekdayKey, activeLanguage);
  const monthRaw = await getTranslation("month", monthKey, activeLanguage);
  const dayBaseRaw = await getTranslation("day", dayKey, activeLanguage);

  const weekday = safeValue(weekdayRaw, weekdayKey);
  const month = safeValue(monthRaw, monthKey);
  const dayBase = safeValue(dayBaseRaw, dayKey);

  const day = `${dayBase}${rule?.day_suffix ?? ""}`.trim();

  let year = String(date.getFullYear());
  if (rule?.year_mode === "bern_words") {
    year = formatBerneseYear(date.getFullYear());
  }

  const article =
    rule?.use_article && rule.article ? `${rule.article} ` : "";

  switch (rule?.date_order) {
    case "weekday_month_day_year":
      return `${weekday} ${month} ${day} ${year}`;

    case "weekday_article_day_month_year":
      return `${weekday} ${article}${day} ${month} ${year}`;

    case "weekday_day_month_year":
    default:
      return `${weekday} ${day} ${month} ${year}`;
  }
}