import { supabase } from "@/lib/supabase";

export async function getDefaultLanguage(): Promise<string> {
  const { data, error } = await supabase
    .from("languages")
    .select("code")
    .eq("is_default", true)
    .maybeSingle();

  if (error) {
    console.error("Fehler bei getDefaultLanguage:", error);
    return "bern";
  }

  return data?.code ?? "bern";
}