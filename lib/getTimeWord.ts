import { supabase } from "@/lib/supabase";
import { getDefaultLanguage } from "@/lib/getDefaultLanguage";

type TimeWordRow = {
  value: string | null;
};

export async function getTimeWord(
  key: string,
  language?: string
): Promise<string> {
  const activeLanguage = language ?? "bern";

  // 1. aktive Sprache
  const { data } = await supabase
    .from("time_words")
    .select("value")
    .eq("key", key)
    .eq("language", activeLanguage)
    .maybeSingle<TimeWordRow>();

  if (data?.value?.trim()) {
    return data.value;
  }

  // 2. Fallback → Default-Sprache
  const defaultLang = await getDefaultLanguage();

  if (defaultLang && defaultLang !== activeLanguage) {
    const fallback = await supabase
      .from("time_words")
      .select("value")
      .eq("key", key)
      .eq("language", defaultLang)
      .maybeSingle<TimeWordRow>();

    if (fallback.data?.value?.trim()) {
      return fallback.data.value;
    }
  }

  // 3. letzter Fallback
  return key;
}