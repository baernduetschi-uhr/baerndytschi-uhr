import { getTranslation } from "@/lib/getTranslation";
import { getLanguageRule } from "@/lib/getLanguageRule";
import { getDateDisplayParts } from "@/src/lib/getDateDisplayParts";
import { formatBerneseYear } from "@/src/lib/formatBerneseYear";
import { getTimeWord } from "@/lib/getTimeWord";

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

// Sprachen die formatBerneseYear verwenden
const BERNESE_LANGS = new Set(["bern", "be"]);

function safeValue(value: string | null | undefined, fallback: string): string {
  return value?.trim() ? value : fallback;
}

export async function formatLocalizedDate(
  date: Date,
  language?: string
): Promise<string> {
  const lang = language ?? "bern";
  const rule = await getLanguageRule(lang);

  const weekdayKey = weekdayKeys[date.getDay()];
  const monthKey = monthKeys[date.getMonth()];
  const dayKey = String(date.getDate());
  const yearKey = String(date.getFullYear());

  // Alle Werte parallel laden
  const [weekdayRaw, monthRaw, dayRaw, yearRaw, configuredParts] =
    await Promise.all([
      getTranslation("weekday", weekdayKey, lang),
      getTranslation("month", monthKey, lang),
      getTranslation("day", dayKey, lang),
      getTranslation("year", yearKey, lang),
      getDateDisplayParts(lang),
    ]);

  const weekday = safeValue(weekdayRaw, weekdayKey);
  const month = safeValue(monthRaw, monthKey);
  const day = safeValue(dayRaw, dayKey).replace(/\.$/, "") +
    (rule?.day_suffix ? rule.day_suffix : "");

  // Jahr: Bärndütsch aus formatBerneseYear, andere aus DB oder Zahl
  const year = BERNESE_LANGS.has(lang)
    ? formatBerneseYear(date.getFullYear())
    : yearRaw && yearRaw !== yearKey
    ? yearRaw
    : yearKey;

  const article =
    rule?.use_article && rule.article ? `${rule.article} ` : "";

  // Wenn keine date_display_parts in DB → Fallback
  if (configuredParts.length === 0) {
    return buildFallback(lang, rule, weekday, article, day, month, year);
  }

  // date_display_parts aus Admin verwenden
  const valueMap: Record<string, string> = {
    weekday,
    article: rule?.article ?? "",
    day,
    month,
    year,
  };

  // connector aus time_words laden falls vorhanden
  const connectorRaw = await getTimeWord("connector", lang);
  if (connectorRaw) valueMap["connector"] = connectorRaw;

  const parts = configuredParts
    .filter((part) => part.is_enabled)
    .sort((a, b) => a.position - b.position)
    .map((part) => {
      // Optionaler Text aus Admin überschreibt Standardwert
      if (part.value?.trim()) return part.value.trim();
      return valueMap[part.part_type] ?? "";
    })
    .filter(Boolean);

  return parts.join(" ").replace(/\s+/g, " ").trim();
}

function buildFallback(
  lang: string,
  rule: Awaited<ReturnType<typeof getLanguageRule>>,
  weekday: string,
  article: string,
  day: string,
  month: string,
  year: string
): string {
  switch (rule?.date_order) {
    case "weekday_month_day_year":
      if (lang === "en") {
        return `${weekday}, ${month} ${day}, ${year}`.replace(/\s+/g, " ").trim();
      }
      return `${weekday} ${month} ${day} ${year}`.replace(/\s+/g, " ").trim();

    case "weekday_article_day_month_year":
      return `${weekday} ${article}${day} ${month} ${year}`
        .replace(/\s+/g, " ")
        .trim();

    case "weekday_day_month_year":
    default:
      return `${weekday} ${day} ${month} ${year}`.replace(/\s+/g, " ").trim();
  }
}