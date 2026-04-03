import type { ThemeVariant } from "@/src/types/common";
import type { ResolvedHoliday } from "@/src/domain/holidays/types";
import type { MealWindow } from "@/src/domain/meal-windows/types";

export type BirthdayDisplay = {
  text: string;
  color: string;
};

export type ClockDisplayState = {
  holidayText: string;
  holidayColor: string;
  birthdays: BirthdayDisplay[];
  mealText: string;
  mealColor: string;
  timeText: string;
  dateText: string;
  digitalText: string;
  digitalDateText: string;
  theme: ThemeVariant;
  holiday: ResolvedHoliday | null;
  meal: MealWindow | null;
};

export type ResolveDisplayStateInput = {
  now: Date;
  showDate: boolean;
  holidays: ResolvedHoliday[];
  meals: MealWindow[];
  birthdays: BirthdayDisplay[];
  dateText: string;
  timeText: string;
  digitalText: string;
  digitalDateText: string;
};

export type DatePart = {
  type: string;
  value: string;
};