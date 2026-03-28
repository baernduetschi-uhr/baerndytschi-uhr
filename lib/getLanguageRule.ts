import { supabase } from "@/lib/supabase";

export type LanguageRule = {
  language_code: string;
  date_order: string;
  article: string | null;
  use_article: boolean;
  day_suffix: string | null;
  year_mode: string | null;
};

export async function getLanguageRule(
  languageCode: string
): Promise<LanguageRule | null> {
  const { data, error } = await supabase
    .from("language_rules")
    .select("*")
    .eq("language_code", languageCode)
    .maybeSingle<LanguageRule>();

  if (error) {
    console.error("Fehler bei getLanguageRule:", error);
    return null;
  }

  return data ?? null;
}