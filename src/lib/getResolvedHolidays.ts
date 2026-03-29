import { supabase } from "@/lib/supabase";
import type {
  Holiday,
  HolidayRule,
  ResolvedHoliday,
} from "@/src/domain/holidays/types";

function toLocalIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function calculateEasterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function buildHolidaysFromRules(
  year: number,
  rules: HolidayRule[]
): ResolvedHoliday[] {
  return rules
    .filter((rule) => rule.active)
    .map((rule): ResolvedHoliday | null => {
      let date: Date | null = null;

      if (rule.rule_type === "fixed" && rule.month && rule.day) {
        date = new Date(year, rule.month - 1, rule.day);
      }

      if (rule.rule_type === "easter_offset" && rule.offset_days !== null) {
        const easter = calculateEasterSunday(year);
        date = addDays(easter, rule.offset_days);
      }

      if (!date) return null;

      return {
        id: `rule-${rule.id}`,
        key: rule.key,
        name: rule.name,
        date: toLocalIsoDate(date),
        text: rule.name,
        active: true,
        source: "rule",
      };
    })
    .filter((item): item is ResolvedHoliday => item !== null);
}

export async function getResolvedHolidays(
  year: number
): Promise<ResolvedHoliday[]> {
  const [
    { data: manualData, error: manualError },
    { data: rulesData, error: rulesError },
  ] = await Promise.all([
    supabase.from("holidays").select("id, key, name, date, text, active"),
    supabase
      .from("holiday_rules")
      .select("id, key, name, rule_type, month, day, offset_days, active")
      .eq("active", true),
  ]);

  if (manualError) throw manualError;
  if (rulesError) throw rulesError;

  const manualHolidays: ResolvedHoliday[] = ((manualData ?? []) as Holiday[]).map(
    (item) => ({
      ...item,
      source: "manual" as const,
    })
  );

  const holidayRules = (rulesData ?? []) as HolidayRule[];
  const generatedHolidays = buildHolidaysFromRules(year, holidayRules);

  return [...manualHolidays, ...generatedHolidays];
  }