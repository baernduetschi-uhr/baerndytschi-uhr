import { supabase } from "@/lib/supabase";
import type { Holiday, HolidayRule } from "@/src/domain/holidays/types";
import { buildHolidaysFromRules } from "@/src/domain/holidays/buildHolidaysFromRules";

export async function getResolvedHolidays(year: number): Promise<Holiday[]> {
  const [{ data: holidaysData, error: holidaysError }, { data: rulesData, error: rulesError }] =
    await Promise.all([
      supabase.from("holidays").select("id, key, name, date, text, active"),
      supabase
        .from("holiday_rules")
        .select("id, key, name, rule_type, month, day, offset_days, active"),
    ]);

  if (holidaysError) {
    throw holidaysError;
  }

  if (rulesError) {
    throw rulesError;
  }

  const manualHolidays = (holidaysData ?? []) as Holiday[];
  const holidayRules = (rulesData ?? []) as HolidayRule[];

  const generatedHolidays = buildHolidaysFromRules({
    year,
    rules: holidayRules,
  });

  return [...manualHolidays, ...generatedHolidays];
}