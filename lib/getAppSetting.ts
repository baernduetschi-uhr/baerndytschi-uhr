import { supabase } from "@/lib/supabase";

type AppSettingRow = {
  value: string | null;
};

export async function getAppSetting(key: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", key)
    .maybeSingle<AppSettingRow>();

  if (error) {
    console.error("Fehler bei getAppSetting:", error);
    return null;
  }

  return data?.value ?? null;
}