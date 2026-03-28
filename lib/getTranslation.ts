import { supabase } from "@/lib/supabase";
import { getDefaultLanguage } from "@/lib/getDefaultLanguage";

type TranslationRow = {
  value: string | null;
};

export async function getTranslation(
  category: string,
  key: string,
  language?: string
): Promise<string> {
  const activeLanguage = language ?? "bern";

  const { data } = await supabase
    .from("translations")
    .select("value")
    .eq("category", category)
    .eq("key", key)
    .eq("language", activeLanguage)
    .maybeSingle<TranslationRow>();

  if (data?.value?.trim()) {
    return data.value;
  }

  const defaultLang = await getDefaultLanguage();

  if (defaultLang && defaultLang !== activeLanguage) {
    const fallback = await supabase
      .from("translations")
      .select("value")
      .eq("category", category)
      .eq("key", key)
      .eq("language", defaultLang)
      .maybeSingle<TranslationRow>();

    if (fallback.data?.value?.trim()) {
      return fallback.data.value;
    }
  }

  return key;
}