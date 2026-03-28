import type { Holiday, HolidayRule } from "./types";
import { calculateEasterSunday } from "./calculateEasterSunday";
import { addDays, toLocalIsoDate } from "./dateHelpers";

type BuildHolidaysFromRulesInput = {
  year: number;
  rules: HolidayRule[];
};

export function buildHolidaysFromRules(
  input: BuildHolidaysFromRulesInput
): Holiday[] {
  const { year, rules } = input;

  return rules
    .filter((rule) => rule.active)
    .map((rule) => {
      let date: Date | null = null;

      if (rule.rule_type === "fixed" && rule.month && rule.day) {
        date = new Date(year, rule.month - 1, rule.day);
      }

      if (rule.rule_type === "easter_offset" && rule.offset_days !== null) {
        const easter = calculateEasterSunday(year);
        date = addDays(easter, rule.offset_days);
      }

      if (!date) {
        return null;
      }

      return {
        id: rule.id,
        key: rule.key,
        name: rule.name,
        date: toLocalIsoDate(date),
        text: rule.name,
        active: rule.active,
      } satisfies Holiday;
    })
    .filter((item): item is Holiday => item !== null);
}