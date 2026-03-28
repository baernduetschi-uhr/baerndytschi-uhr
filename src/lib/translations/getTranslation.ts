import { supabase } from "@/lib/supabase";

export async function getTranslation(
  category: string,
  key: string,
  language: string = "bern"
): Promise<string> {
  const { data, error } = await supabase
    .from("translations")
    .select("value")
    .eq("category", category)
    .eq("key", key)
    .eq("language", language)
    .single();

  if (error || !data) {
    console.warn("Missing translation:", { category, key, language });
    return key; // fallback
  }

  return data.value;
}