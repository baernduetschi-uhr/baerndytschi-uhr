"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type TimeWord = {
  id: string;
  key: string;
  value: string;
  language: string;
};

type LanguageOption = {
  code: string;
  label: string;
};

const labels: Record<string, string> = {
  exact: "Punkt",
  plus_5: "5 nach",
  plus_10: "10 nach",
  quarter_past: "Viertel nach",
  twenty_past: "20 nach",
  five_before_half: "5 vor halb",
  half: "Halb",
  five_after_half: "5 nach halb",
  twenty_to: "20 vor",
  quarter_to: "Viertel vor",
  ten_to: "10 vor",
  five_to: "5 vor",
  past: "nach (generisch)",
  to: "vor (generisch)",
  after_half: "nach halb (generisch)",
  hour_0: "Stunde 0 (Mitternacht)",
  hour_1: "Stunde 1",
  hour_2: "Stunde 2",
  hour_3: "Stunde 3",
  hour_4: "Stunde 4",
  hour_5: "Stunde 5",
  hour_6: "Stunde 6",
  hour_7: "Stunde 7",
  hour_8: "Stunde 8",
  hour_9: "Stunde 9",
  hour_10: "Stunde 10",
  hour_11: "Stunde 11",
  hour_12: "Stunde 12 (Mittag)",
  hour_13: "Stunde 13",
  hour_14: "Stunde 14",
  hour_15: "Stunde 15",
  hour_16: "Stunde 16",
  hour_17: "Stunde 17",
  hour_18: "Stunde 18",
  hour_19: "Stunde 19",
  hour_20: "Stunde 20",
  hour_21: "Stunde 21",
  hour_22: "Stunde 22",
  hour_23: "Stunde 23",
};

const sortOrder = [
  "exact", "plus_5", "plus_10", "quarter_past", "twenty_past",
  "five_before_half", "half", "five_after_half", "twenty_to",
  "quarter_to", "ten_to", "five_to", "past", "to", "after_half",
  "hour_0", "hour_1", "hour_2", "hour_3", "hour_4", "hour_5",
  "hour_6", "hour_7", "hour_8", "hour_9", "hour_10", "hour_11",
  "hour_12", "hour_13", "hour_14", "hour_15", "hour_16", "hour_17",
  "hour_18", "hour_19", "hour_20", "hour_21", "hour_22", "hour_23",
];

export default function TimeWordsPage() {
  const [items, setItems] = useState<TimeWord[]>([]);
  const [languages, setLanguages] = useState<LanguageOption[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Sprachen laden
  useEffect(() => {
    async function loadLanguages() {
      const { data } = await supabase
        .from("languages")
        .select("code, label")
        .eq("active", true)
        .order("label", { ascending: true });
      const langs = (data ?? []) as LanguageOption[];
      setLanguages(langs);
      if (langs.length > 0) setSelectedLanguage(langs[0].code);
    }
    loadLanguages();
  }, []);

  // Zeitwörter laden wenn Sprache wechselt
  useEffect(() => {
    if (!selectedLanguage) return;
    loadItems();
  }, [selectedLanguage]);

  async function loadItems() {
    setLoading(true);

    const { data, error } = await supabase
      .from("time_words")
      .select("*")
      .eq("language", selectedLanguage);

    if (error) {
      console.error("Fehler beim Laden:", error);
      setLoading(false);
      return;
    }

    const rows = ((data ?? []) as TimeWord[]).sort((a, b) => {
      const ai = sortOrder.indexOf(a.key);
      const bi = sortOrder.indexOf(b.key);
      if (ai === -1 && bi === -1) return a.key.localeCompare(b.key, "de-CH");
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });

    setItems(rows);
    setSelectedId(rows[0]?.id ?? null);
    setLoading(false);
  }

  const draft = items.find((item) => item.id === selectedId) ?? null;

  function setDraft(updated: TimeWord) {
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  }

  async function saveItem() {
    if (!draft) return;

    setSaving(true);

    const { error } = await supabase
      .from("time_words")
      .update({ value: draft.value })
      .eq("id", draft.id);

    setSaving(false);

    if (error) {
      console.error("Fehler beim Speichern:", JSON.stringify(error, null, 2));
      alert(`Fehler: ${error.message}`);
      return;
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div className="text-white">
      <div className="mb-8">
        <div className="text-xs tracking-[0.35em] uppercase text-zinc-400 mb-2">Admin</div>
        <h1 className="text-5xl font-semibold tracking-tight">Zeitwörter verwalten</h1>
        <p className="text-zinc-400 mt-3">
          Zeitwörter pro Sprache bearbeiten.
        </p>
      </div>

      {/* Sprachauswahl */}
      <div className="mb-8">
        <select
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
          className="rounded-full border border-zinc-700 bg-zinc-950 px-5 py-2.5 text-sm text-white outline-none cursor-pointer hover:border-zinc-500 transition"
        >
          {languages.map(lang => (
            <option key={lang.code} value={lang.code}>
              {lang.label} ({lang.code})
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-zinc-500">Lade...</div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[360px_minmax(0,1fr)] gap-6">
          {/* Liste */}
          <section className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-5">
            <div className="mb-5">
              <h2 className="text-3xl font-semibold">Zeitwörter</h2>
              <p className="text-zinc-500 text-sm mt-1">{items.length} Einträge</p>
            </div>

            <div className="space-y-3">
              {items.map((item) => {
                const active = item.id === selectedId;
                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    className={[
                      "w-full rounded-[1.5rem] border px-5 py-4 text-left transition",
                      active
                        ? "bg-zinc-100 text-black border-zinc-100"
                        : "bg-transparent text-white border-zinc-800 hover:border-zinc-600",
                    ].join(" ")}
                  >
                    <div className="text-lg font-medium">
                      {labels[item.key] ?? item.key}
                    </div>
                    <div className={active ? "text-zinc-600 mt-1" : "text-zinc-400 mt-1"}>
                      {item.value || "—"}
                    </div>
                  </button>
                );
              })}

              {items.length === 0 && (
                <div className="text-zinc-500">Keine Zeitwörter für diese Sprache.</div>
              )}
            </div>
          </section>

          {/* Bearbeiten */}
          <section className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-8">
            {draft ? (
              <>
                <h2 className="text-4xl font-semibold mb-8">Zeitwort bearbeiten</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <label className="block">
                    <div className="text-zinc-400 mb-2">Schlüssel</div>
                    <input
                      value={draft.key}
                      disabled
                      className="w-full rounded-2xl border border-zinc-800 bg-black px-5 py-4 text-white opacity-80"
                    />
                  </label>

                  <label className="block">
                    <div className="text-zinc-400 mb-2">Sprache</div>
                    <input
                      value={draft.language}
                      disabled
                      className="w-full rounded-2xl border border-zinc-800 bg-black px-5 py-4 text-white opacity-80"
                    />
                  </label>

                  <label className="block md:col-span-2">
                    <div className="text-zinc-400 mb-2">Anzeigetext</div>
                    <input
                      value={draft.value}
                      onChange={(e) => setDraft({ ...draft, value: e.target.value })}
                      className="w-full rounded-2xl border border-zinc-800 bg-black px-5 py-4 text-white outline-none"
                      placeholder={`Wert für ${labels[draft.key] ?? draft.key}`}
                    />
                  </label>
                </div>

                <div className="flex gap-4 mt-8">
                  <button
                    onClick={saveItem}
                    disabled={saving}
                    className={[
                      "rounded-full px-8 py-4 text-xl transition",
                      saving
                        ? "bg-zinc-300 text-black opacity-70 cursor-not-allowed"
                        : "bg-white text-black hover:opacity-90",
                    ].join(" ")}
                  >
                    {saving ? "Speichere..." : "Speichern"}
                  </button>
                </div>

                {saved && <div className="mt-4 text-green-400">✓ gespeichert</div>}

                {/* Vorschau */}
                <div className="mt-10 rounded-[1.75rem] border border-zinc-800 p-6">
                  <div className="text-xs tracking-[0.35em] uppercase text-zinc-500 mb-4">Vorschau</div>
                  <div className="text-6xl font-semibold">{draft.value || "—"}</div>
                  <div className="text-zinc-400 mt-4 text-xl">{labels[draft.key] ?? draft.key}</div>
                  <div className="text-zinc-500 mt-2">Sprache: {draft.language}</div>
                </div>
              </>
            ) : (
              <div className="text-zinc-500">Wähle links ein Zeitwort aus.</div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}