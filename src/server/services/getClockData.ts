import { getTranslation } from "@/lib/getTranslation";
import { formatLocalizedDate } from "@/src/lib/formatLocalizedDate";
import { formatBerneseTime } from "@/src/lib/formatBerneseTime";
import { resolveDisplayState } from "@/src/domain/clock/resolveDisplayState";
import type { ClockDisplayState, BirthdayDisplay } from "@/src/domain/clock/types";
import type { ResolvedHoliday } from "@/src/domain/holidays/types";
import type { MealWindow } from "@/src/domain/meal-windows/types";

type Birthday = {
  id: string;
  name: string;
  date: string; // MM-DD
  active: boolean;
  display_word_key: string | null;
  color: string;
};

type GetClockDataInput = {
  now: Date;
  language: string;
  holidays: ResolvedHoliday[];
  meals: MealWindow[];
  birthdays: Birthday[];
  showDate: boolean;
};

function extractScopedTranslationKey(
  scopedKey: string | null | undefined,
  prefix: string
): string | null {
  if (!scopedKey) return null;
  if (!scopedKey.startsWith(`${prefix}.`)) return null;
  const key = scopedKey.slice(prefix.length + 1).trim();
  return key || null;
}

async function enrichMealsWithTranslatedLabel(
  meals: MealWindow[],
  language: string
): Promise<MealWindow[]> {
  return Promise.all(
    meals.map(async (meal) => {
      const translationKey = extractScopedTranslationKey(meal.key, "meal");
      if (!translationKey) return meal;
      const translatedLabel = await getTranslation("meal", translationKey, language);
      const shouldUseFallback = !translatedLabel || translatedLabel === translationKey;
      return { ...meal, label: shouldUseFallback ? meal.label : translatedLabel };
    })
  );
}

async function enrichHolidaysWithTranslatedText(
  holidays: ResolvedHoliday[],
  language: string
): Promise<ResolvedHoliday[]> {
  return Promise.all(
    holidays.map(async (holiday) => {
      const translationKey = extractScopedTranslationKey(holiday.key, "holiday");
      if (!translationKey) return holiday;
      const translatedText = await getTranslation("holiday", translationKey, language);
      const shouldUseFallback = !translatedText || translatedText === translationKey;
      return { ...holiday, text: shouldUseFallback ? holiday.text : translatedText };
    })
  );
}

export async function getClockData(
  input: GetClockDataInput
): Promise<ClockDisplayState> {
  const { now, language, holidays, meals, birthdays, showDate } = input;

  const locale = language === "en" ? "en-GB" : "de-CH";
  const digitalText = now.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
  const digitalDateText = now.toLocaleDateString(locale);

  // Geburtstage prüfen — mehrere am gleichen Tag möglich
  const todayMMDD = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const activeBirthdays = birthdays.filter(b => b.active && b.date === todayMMDD);

  const birthdayDisplays: BirthdayDisplay[] = await Promise.all(
    activeBirthdays.map(async (birthday) => {
      let text = "";
      if (birthday.display_word_key) {
        const displayWordText = await getTranslation("display_word", birthday.display_word_key, language);
        if (displayWordText && displayWordText !== birthday.display_word_key) {
          text = displayWordText.includes("{name}")
            ? `🎂 ${displayWordText.replace("{name}", birthday.name)}`
            : `🎂 ${displayWordText} · ${birthday.name}`;
        } else {
          text = `🎂 ${birthday.name}`;
        }
      } else {
        text = `🎂 ${birthday.name}`;
      }
      return { text, color: birthday.color ?? "pink" };
    })
  );

  const [dateText, timeText, translatedMeals, translatedHolidays] =
    await Promise.all([
      formatLocalizedDate(now, language),
      formatBerneseTime(now, language),
      enrichMealsWithTranslatedLabel(meals, language),
      enrichHolidaysWithTranslatedText(holidays, language),
    ]);

  return resolveDisplayState({
    now,
    showDate,
    holidays: translatedHolidays,
    meals: translatedMeals,
    birthdays: birthdayDisplays,
    dateText,
    timeText,
    digitalText,
    digitalDateText,
  });
}