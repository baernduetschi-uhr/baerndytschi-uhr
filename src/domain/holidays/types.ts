export type Holiday = {
  id: string;
  key: string | null;
  name: string;
  date: string;
  text: string;
  active: boolean;
};

export type HolidayRule = {
  id: string;
  key: string;
  name: string;
  rule_type: "fixed" | "easter_offset";
  month: number | null;
  day: number | null;
  offset_days: number | null;
  active: boolean;
};

export type ResolvedHoliday = {
  id: string;
  key: string | null;
  name: string;
  date: string;
  text: string;
  active: boolean;
  source: "manual" | "rule";
};