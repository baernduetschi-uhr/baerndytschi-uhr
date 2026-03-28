import type { Holiday } from "./types";

function toLocalIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

type ResolveHolidayInput = {
  now: Date;
  holidays: Holiday[];
};

export function resolveHoliday({
  now,
  holidays,
}: ResolveHolidayInput): Holiday | null {
  const today = toLocalIsoDate(now);

  return (
    holidays.find((holiday) => holiday.active && holiday.date === today) ?? null
  );
}