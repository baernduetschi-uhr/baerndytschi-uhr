import { getTranslation } from "@/lib/getTranslation";
import { getLanguageRule } from "@/lib/getLanguageRule";
import { formatBerneseYear } from "@/src/lib/formatBerneseYear";
import { getDateDisplayParts } from "@/src/lib/getDateDisplayParts";
import type { DatePart } from "@/src/domain/clock/types";

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

function safe(value: string | null | undefined, fallback: string): string {
  return value?.trim() || fallback;
}

function overrideOrDefault(
  customValue: string | null | undefined,
  defaultValue: string
): string {
  return customValue?.trim() ? customValue.trim() : defaultValue;
}

export async function formatLocalizedDateParts(
  date: Date,
  language?: string
): Promise<DatePart[]> {
  const lang = language ?? "bern";
  const rule = await getLanguageRule(lang);

  const weekdayKey = weekdayKeys[date.getDay()];
  const monthKey = monthKeys[date.getMonth()];
  const dayKey = String(date.getDate());
  const yearKey = String(date.getFullYear());

  const [weekdayRaw, monthRaw, dayWordRaw, dayRaw, yearRaw, configuredParts] =
    await Promise.all([
      getTranslation("weekday", weekdayKey, lang),
      getTranslation("month", monthKey, lang),
      getTranslation("day_word", dayKey, lang),
      getTranslation("day", dayKey, lang),
      getTranslation("year", yearKey, lang),
      getDateDisplayParts(lang),
    ]);

  const weekday = safe(weekdayRaw, weekdayKey);
  const month = safe(monthRaw, monthKey);

  const dayBase =
    dayWordRaw && dayWordRaw !== dayKey ? dayWordRaw : dayRaw;

  const day = `${safe(dayBase, dayKey).replace(/\.$/, "")}${
    rule?.day_suffix ?? ""
  }`.trim();

  const year =
    lang === "bern"
      ? formatBerneseYear(date.getFullYear())
      : yearRaw && yearRaw !== yearKey
      ? yearRaw
      : yearKey;

  const fallbackParts: DatePart[] =
    lang === "en"
      ? [
          { type: "weekday", value: weekday },
          { type: "month", value: month },
          { type: "day", value: day },
          { type: "year", value: year },
        ]
      : [
          { type: "weekday", value: weekday },
          ...(rule?.use_article && rule.article
            ? [{ type: "article" as const, value: rule.article }]
            : []),
          { type: "day", value: day },
          { type: "month", value: month },
          { type: "year", value: year },
        ];

  if (configuredParts.length === 0) {
    return fallbackParts;
  }

  const resolved = configuredParts
    .filter((part) => part.is_enabled)
    .map<DatePart | null>((part) => {
      switch (part.part_type) {
        case "weekday":
          return {
            type: "weekday",
            value: overrideOrDefault(part.value, weekday),
          };

        case "article":
          return part.value?.trim()
            ? { type: "article", value: part.value.trim() }
            : null;

        case "day":
          return {
            type: "day",
            value: overrideOrDefault(part.value, day),
          };

        case "month":
          return {
            type: "month",
            value: overrideOrDefault(part.value, month),
          };

        case "connector":
          return part.value?.trim()
            ? { type: "connector", value: part.value.trim() }
            : null;

        case "year":
          return {
            type: "year",
            value: overrideOrDefault(part.value, year),
          };

        default:
          return null;
      }
    })
    .filter((part): part is DatePart => part !== null);

  return resolved;
}