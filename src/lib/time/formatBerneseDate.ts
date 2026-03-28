import { getTranslation } from "@/lib/getTranslation";

const weekdayKeys = [
  "sunday","monday","tuesday","wednesday",
  "thursday","friday","saturday"
];

const monthKeys = [
  "january","february","march","april",
  "may","june","july","august",
  "september","october","november","december"
];

export async function formatBerneseDate(date: Date): Promise<string> {
  const weekdayKey = weekdayKeys[date.getDay()];
  const monthKey = monthKeys[date.getMonth()];

  const weekday = await getTranslation("weekday", weekdayKey);
  const month = await getTranslation("month", monthKey);

  const day = date.getDate();
  const year = date.getFullYear();

  return `${weekday} dä ${day}. ${month} ${year}`;
}