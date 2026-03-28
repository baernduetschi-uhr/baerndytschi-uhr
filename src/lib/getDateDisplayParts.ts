import { supabase } from "@/lib/supabase";

export type DateDisplayPartRow = {
  id: string;
  language: string;
  position: number;
  part_type: "weekday" | "article" | "day" | "month" | "year" | "connector";
  label: string;
  value: string | null;
  is_enabled: boolean;
};

export async function getDateDisplayParts(
  language: string
): Promise<DateDisplayPartRow[]> {
  const { data, error } = await supabase
    .from("date_display_parts")
    .select("id, language, position, part_type, label, value, is_enabled")
    .eq("language", language)
    .order("position", { ascending: true });

  if (error) {
    console.error("Fehler bei getDateDisplayParts:", error);
    return [];
  }

  return (data ?? []) as DateDisplayPartRow[];
}