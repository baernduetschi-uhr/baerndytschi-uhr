import type { ResolveDisplayStateInput, ClockDisplayState } from "./types";

function isSameDate(a: Date, b: string) {
  return a.toISOString().slice(0, 10) === b;
}

export function resolveDisplayState(
  input: ResolveDisplayStateInput
): ClockDisplayState {
  const {
    now,
    holidays,
    meals,
    dateText,
    timeText,
    digitalText,
    digitalDateText,
    birthdays,
  } = input;

  const activeHoliday = holidays.find(
    (h) => h.active && isSameDate(now, h.date)
  );

  const activeMeal = meals.find(
    (m) =>
      m.active &&
      now.toTimeString().slice(0, 5) >= m.from.slice(0, 5) &&
      now.toTimeString().slice(0, 5) <= m.to.slice(0, 5)
  );

 return {
  holidayText: activeHoliday?.text ?? "",
  holidayColor: (activeHoliday as any)?.color ?? "gold",
  birthdays: birthdays ?? [],
  mealText: activeMeal?.label ?? "",
  mealColor: (activeMeal as any)?.color ?? "white",
  timeText,
  dateText,
  digitalText,
  digitalDateText,
  theme: activeHoliday ? "holiday" : "default",
  holiday: activeHoliday ?? null,
  meal: activeMeal ?? null,
};
}