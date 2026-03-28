"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type LanguageItem = {
  code: string;
  label: string;
  active: boolean;
  is_default?: boolean;
};

export default function LanguageExportPage() {
  const [languages, setLanguages] = useState<LanguageItem[]>([]);
  const [selectedCode, setSelectedCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [exportText, setExportText] = useState("");
  const [status, setStatus] = useState("");
  const [details, setDetails] = useState<string[]>([]);

  useEffect(() => {
    async function loadLanguages() {
      setLoading(true);

      const { data, error } = await supabase
        .from("languages")
        .select("code, label, active, is_default")
        .order("label", { ascending: true });

      if (error) {
        console.error("Fehler bim Lade vo de Sprache:", error);
        setStatus("❌ Fehler bim Lade vo de Sprache.");
        setLoading(false);
        return;
      }

      const rows = (data ?? []) as LanguageItem[];
      setLanguages(rows);
      setSelectedCode(rows[0]?.code ?? "");
      setLoading(false);
    }

    loadLanguages();
  }, []);

  async function handleExport() {
    if (!selectedCode) return;

    setStatus("Export lauft...");
    setExportText("");
    setDetails([]);

    const selectedLanguage =
      languages.find((lang) => lang.code === selectedCode) ?? null;

    const { data: translations, error: translationsError } = await supabase
      .from("translations")
      .select("category, key, value")
      .eq("language", selectedCode)
      .order("category", { ascending: true })
      .order("key", { ascending: true });

    if (translationsError) {
      console.error("Fehler bei translations:", translationsError);
      setStatus("❌ Fehler bim Lade vo de Übersetzige.");
      return;
    }

    const { data: timeWords, error: timeWordsError } = await supabase
      .from("time_words")
      .select("key, value")
      .eq("language", selectedCode)
      .order("key", { ascending: true });

    if (timeWordsError) {
      console.error("Fehler bei time_words:", timeWordsError);
      setStatus("❌ Fehler bim Lade vo de Zytwörter.");
      return;
    }

    const exportObject = {
      language: selectedLanguage
        ? {
            code: selectedLanguage.code,
            label: selectedLanguage.label,
            active: selectedLanguage.active,
            is_default: selectedLanguage.is_default ?? false,
          }
        : {
            code: selectedCode,
            label: selectedCode,
            active: true,
            is_default: false,
          },
      translations: translations ?? [],
      time_words: timeWords ?? [],
    };

    const json = JSON.stringify(exportObject, null, 2);
    setExportText(json);
    setStatus("✅ Export erfolgrych.");
    setDetails([
      `Sprache: ${selectedCode}`,
      `Übersetzige: ${translations?.length ?? 0}`,
      `Zytwörter: ${timeWords?.length ?? 0}`,
    ]);
  }

  function downloadJson() {
    if (!exportText || !selectedCode) return;

    const blob = new Blob([exportText], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedCode}.json`;
    a.click();

    URL.revokeObjectURL(url);

    setStatus("✅ Datei glade.");
  }

  return (
    <div className="max-w-5xl text-white">
      <div className="mb-8">
        <div className="mb-2 text-xs uppercase tracking-[0.35em] text-zinc-400">
          Admin
        </div>
        <h1 className="text-5xl font-semibold">Sprache exportiere</h1>
        <p className="mt-3 text-zinc-400">
          Exportiert e Sprache als JSON-Datei.
        </p>
      </div>

      {loading ? (
        <div className="text-zinc-500">Lade...</div>
      ) : (
        <div className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-[280px_1fr]">
            <div>
              <label className="block">
                <div className="mb-2 text-zinc-400">Sprache</div>
                <select
                  value={selectedCode}
                  onChange={(e) => setSelectedCode(e.target.value)}
                  className="w-full rounded-2xl border border-zinc-800 bg-black px-5 py-4 text-white outline-none"
                >
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.label} ({lang.code})
                    </option>
                  ))}
                </select>
              </label>

              <div className="mt-6 flex flex-wrap gap-4">
                <button
                  onClick={handleExport}
                  className="rounded-full bg-white px-6 py-3 text-black"
                >
                  Exportiere
                </button>

                <button
                  onClick={downloadJson}
                  disabled={!exportText}
                  className={[
                    "rounded-full border px-6 py-3 transition",
                    exportText
                      ? "border-zinc-700 text-white hover:border-zinc-500"
                      : "cursor-not-allowed border-zinc-800 text-zinc-600",
                  ].join(" ")}
                >
                  Datei lade
                </button>
              </div>

              {status && <div className="mt-4 text-sm">{status}</div>}

              {details.length > 0 && (
                <div className="mt-4 space-y-2 rounded-2xl border border-zinc-800 p-4 text-sm text-zinc-300">
                  {details.map((item, index) => (
                    <div key={index}>{item}</div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="mb-2 text-zinc-400">JSON-Vorschau</div>
              <textarea
                value={exportText}
                readOnly
                className="h-[420px] w-full rounded-xl border border-zinc-800 bg-black p-4 font-mono text-sm outline-none"
                placeholder="Da chunnt dr Export ine..."
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}