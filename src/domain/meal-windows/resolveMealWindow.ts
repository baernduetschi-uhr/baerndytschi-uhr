import type { MealWindow } from "./types";

function toMinutes(value: string): number {
  const parts = value.split(":");
  const h = Number(parts[0] ?? 0);
  const m = Number(parts[1] ?? 0);
  return h * 60 + m;
}

type ResolveMealWindowInput = {
  now: Date;
  meals: MealWindow[];
};

export function resolveMealWindow({
  now,
  meals,
}: ResolveMealWindowInput): MealWindow | null {
  const minutes = now.getHours() * 60 + now.getMinutes();

  return (
    meals.find((meal) => {
      if (!meal.active) return false;
      return minutes >= toMinutes(meal.from) && minutes < toMinutes(meal.to);
    }) ?? null
  );
}