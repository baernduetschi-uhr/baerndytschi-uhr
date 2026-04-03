"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Holiday = {
  id: string;
  key: string | null;
  name: string;
  date: string;
  text: string;
  active: boolean;
  color: string;
};

type LanguageOption = {
  code: string;
  label: string;
};

type TranslationRow = {
  language: string;
  value: string;
};

const KEY_SUGGESTIONS = [
  "holiday.new_year",
  "holiday.berchtoldstag",
  "holiday.good_friday",
  "holiday.easter",
  "holiday.easter_monday",
  "holiday.ascension",
  "holiday.whit_sunday",
  "holiday.whit_monday",
  "holiday.national_day",
  "holiday.christmas",
  "holiday.boxing_day",
  "holiday.new_year_eve",
];

const COLORS = [
  { value: "gold",   label: "Gold",   bg: "bg-yellow-500",  border: "border-yellow-400",  text: "text-yellow-300",  preview: "#eab308" },
  { value: "white",  label: "Weiss",  bg: "bg-white",       border: "border-white",        text: "text-white",       preview: "#ffffff" },
  { value: "pink",   label: "Rosa",   bg: "bg-pink-500",    border: "border-pink-400",     text: "text-pink-300",    preview: "#ec4899" },
  { value: "blue",   label: "Blau",   bg: "bg-blue-500",    border: "border-blue-400",     text: "text-blue-300",    preview: "#3b82f6" },
  { value: "red",    label: "Rot",    bg: "bg-red-500",     border: "border-red-400",      text: "text-red-300",     preview: "#ef4444" },
  { value: "green",  label: "Grün",   bg: "bg-green-500",   border: "border-green-400",    text: "text-green-300",   preview: "#22c55e" },
  { value: "purple", label: "Lila",   bg: "bg-purple-500",  border: "border-purple-400",   text: "text-purple-300",  preview: "#a855f7" },
  { value: "orange", label: "Orange", bg: "bg-orange-500",  border: "border-orange-400",   text: "text-orange-300",  preview: "#f97316" },
];

function nameToKey(name: string): string {
  return "holiday." + name
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function extractTranslationKey(key: string | null): string | null {
  if (!key) return null;
  if (!key.startsWith("holiday.")) return null;
  return key.slice("holiday.".length).trim() || null;
}

export default function HolidaysPage() {
  const [items, setItems] = useState<Holiday[]>([]);
  const [languages, setLanguages] = useState<LanguageOption[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [translations, setTranslations] = useState<TranslationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      const [holidaysResult, languagesResult] = await Promise.all([
        supabase.from("holidays").select("*").order("date", { ascending: true }),
        supabase.from("languages").select("code, label").eq("active", true).order("label", { ascending: true }),
      ]);
      const rows = (holidaysResult.data ?? []) as Holiday[];
      setItems(rows);
      setLanguages((languagesResult.data ?? []) as LanguageOption[]);
      setSelectedId(rows[0]?.id ?? null);
      setLoading(false);
    }
    loadAll();
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    const holiday = items.find((i) => i.id === selectedId);
    if (!holiday) return;

    const tKey = extractTranslationKey(holiday.key);
    if (!tKey) {
      setTranslations(languages.map((l) => ({ language: l.code, value: "" })));
      return;
    }

    async function loadTranslations() {
      const { data } = await supabase
        .from("translations")
        .select("language, value")
        .eq("category", "holiday")
        .eq("key", tKey!);

      const existing = (data ?? []) as TranslationRow[];
      const existingMap = new Map(existing.map((t) => [t.language, t.value]));
      setTranslations(languages.map((l) => ({
        language: l.code,
        value: existingMap.get(l.code) ?? "",
      })));
    }
    loadTranslations();
  }, [selectedId, items, languages]);

  const draft = items.find((item) => item.id === selectedId) ?? null;

  function setDraft(updated: Holiday) {
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  }

  function setTranslationValue(language: string, value: string) {
    setTranslations((prev) => prev.map((t) => (t.language === language ? { ...t, value } : t)));
  }

  async function createNewItem() {
    const newItem = {
      key: null,
      name: "Neuer Feiertag",
      date: new Date().toISOString().slice(0, 10),
      text: "",
      active: true,
      color: "gold",
    };
    const { data, error } = await supabase.from("holidays").insert(newItem).select().single();
    if (error) { console.error("Fehler:", error); alert(`Fehler: ${error.message}`); return; }
    const created = data as Holiday;
    setItems((prev) => [...prev, created].sort((a, b) => a.date.localeCompare(b.date)));
    setSelectedId(created.id);
  }

  async function saveItem() {
    if (!draft) return;
    setSaving(true);

    const { error } = await supabase
      .from("holidays")
      .update({
        key: draft.key?.trim() || null,
        name: draft.name,
        date: draft.date,
        text: draft.text,
        active: draft.active,
        color: draft.color,
      })
      .eq("id", draft.id);

    if (error) { console.error("Fehler:", error); setSaving(false); return; }

    const tKey = extractTranslationKey(draft.key);
    if (tKey) {
      const rows = translations
        .filter((t) => t.value.trim())
        .map((t) => ({ category: "holiday", key: tKey, value: t.value.trim(), language: t.language }));
      if (rows.length > 0) {
        await supabase.from("translations").upsert(rows, { onConflict: "language,category,key" });
      }
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
    setItems((prev) => [...prev].sort((a, b) => a.date.localeCompare(b.date)));
  }

  async function deleteItem() {
    if (!draft) return;
    const confirmed = confirm(`Feiertag «${draft.name}» wirklich löschen?`);
    if (!confirmed) return;

    const tKey = extractTranslationKey(draft.key);
    if (tKey) {
      await supabase.from("translations").delete().eq("category", "holiday").eq("key", tKey);
    }

    const { error } = await supabase.from("holidays").delete().eq("id", draft.id);
    if (error) { console.error("Fehler:", error); return; }

    const remaining = items.filter((i) => i.id !== draft.id);
    setItems(remaining);
    setSelectedId(remaining[0]?.id ?? null);
  }

  const activeColor = COLORS.find(c => c.value === (draft?.color ?? "gold")) ?? COLORS[0];

  return (
    <div className="text-white">
      <div className="mb-8">
        <div className="mb-2 text-xs uppercase tracking-[0.35em] text-zinc-400">Admin</div>
        <h1 className="text-5xl font-semibold tracking-tight">Feiertage verwalte</h1>
        <p className="mt-3 text-zinc-400">Änderige wärde direkt i Supabase gspeicheret.</p>
      </div>

      {loading ? (
        <div className="text-zinc-500">Lade...</div>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">

          {/* Liste */}
          <section className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-5">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-3xl font-semibold">Feiertäg</h2>
              <button onClick={createNewItem} className="rounded-full bg-white px-5 py-3 text-black">Neu</button>
            </div>

            <div className="space-y-4">
              {items.map((item) => {
                const active = item.id === selectedId;
                const color = COLORS.find(c => c.value === item.color) ?? COLORS[0];
                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    className={[
                      "w-full rounded-[1.5rem] border px-5 py-4 text-left transition",
                      active ? "border-zinc-100 bg-zinc-100 text-black" : "border-zinc-800 bg-transparent text-white hover:border-zinc-600",
                    ].join(" ")}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${color.bg}`} />
                      <div className="text-2xl font-medium">{item.name || item.key || "—"}</div>
                    </div>
                    {item.key && (
                      <div className="mt-1 text-xs uppercase tracking-[0.18em] text-zinc-500">{item.key}</div>
                    )}
                    <div className={active ? "mt-2 text-zinc-600" : "mt-2 text-zinc-400"}>{item.date}</div>
                  </button>
                );
              })}
              {items.length === 0 && <div className="text-zinc-500">No kei Feiertäg vorhanden.</div>}
            </div>
          </section>

          {/* Bearbeiten */}
          <section className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-8">
            {draft ? (
              <>
                <h2 className="mb-8 text-4xl font-semibold">Feiertag bearbeite</h2>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  {/* Name */}
                  <label className="block">
                    <div className="mb-2 text-zinc-400">Name</div>
                    <input
                      value={draft.name}
                      onChange={(e) => {
                        const newName = e.target.value;
                        setDraft({ ...draft, name: newName, key: draft.key ?? nameToKey(newName) });
                      }}
                      className="w-full rounded-2xl border border-zinc-800 bg-black px-5 py-4 text-white outline-none focus:border-zinc-600 transition"
                    />
                  </label>

                  {/* Datum */}
                  <label className="block">
                    <div className="mb-2 text-zinc-400">Datum</div>
                    <input
                      type="date"
                      value={draft.date}
                      onChange={(e) => setDraft({ ...draft, date: e.target.value })}
                      className="w-full rounded-2xl border border-zinc-800 bg-black px-5 py-4 text-white outline-none focus:border-zinc-600 transition"
                    />
                  </label>

                  {/* Farbe */}
                  <div className="md:col-span-2">
                    <div className="mb-3 text-zinc-400">Farb</div>
                    <div className="flex flex-wrap gap-4">
                      {COLORS.map(color => (
                        <label key={color.value} className="flex items-center gap-2 cursor-pointer">
                          <div
                            className={[
                              "w-6 h-6 rounded-full border-2 flex items-center justify-center transition",
                              draft.color === color.value ? `${color.bg} ${color.border}` : "border-zinc-600 bg-transparent",
                            ].join(" ")}
                            onClick={() => setDraft({ ...draft, color: color.value })}
                          >
                            {draft.color === color.value && (
                              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                <path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </div>
                          <span className={draft.color === color.value ? color.text : "text-zinc-400"}>{color.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Key */}
                  <label className="block md:col-span-2">
                    <div className="mb-2 text-zinc-400">Interner Key</div>
                    <input
                      value={draft.key ?? ""}
                      onChange={(e) => setDraft({ ...draft, key: e.target.value })}
                      list="holiday-key-suggestions"
                      placeholder="holiday.christmas"
                      className="w-full rounded-2xl border border-zinc-800 bg-black px-5 py-4 text-white outline-none focus:border-zinc-600 transition"
                    />
                    <datalist id="holiday-key-suggestions">
                      {KEY_SUGGESTIONS.map((key) => <option key={key} value={key} />)}
                    </datalist>
                    <div className="mt-2 text-sm text-zinc-500">
                      Format: <span className="text-zinc-300">holiday.name</span> — wird für Übersetzungen verwendet
                    </div>
                  </label>

                  {/* Fallback-Text */}
                  <label className="block md:col-span-2">
                    <div className="mb-2 text-zinc-400">Fallback-Text (Bärndütsch)</div>
                    <input
                      value={draft.text}
                      onChange={(e) => setDraft({ ...draft, text: e.target.value })}
                      placeholder="z. B. äs isch Wiehnacht"
                      className="w-full rounded-2xl border border-zinc-800 bg-black px-5 py-4 text-white outline-none focus:border-zinc-600 transition"
                    />
                    <div className="mt-2 text-sm text-zinc-500">Wird angezeigt falls keine Übersetzung vorhanden ist.</div>
                  </label>

                  {/* Aktiv */}
                  <label className="mt-2 flex items-center gap-3 md:col-span-2">
                    <input type="checkbox" checked={draft.active} onChange={(e) => setDraft({ ...draft, active: e.target.checked })} />
                    <span className="text-zinc-300">Aktiv</span>
                  </label>
                </div>

                {/* Übersetzungen */}
                <div className="mt-8">
                  <h3 className="text-2xl font-semibold mb-4">Übersetzungen</h3>
                  <p className="text-sm text-zinc-500 mb-5">Text der pro Sprache auf der Uhr erscheint wenn dieser Feiertag aktiv ist.</p>

                  {extractTranslationKey(draft.key) ? (
                    <div className="grid gap-4">
                      {translations.map((t) => {
                        const lang = languages.find((l) => l.code === t.language);
                        return (
                          <div key={t.language} className="grid grid-cols-[120px_minmax(0,1fr)] gap-4 items-center">
                            <div className="text-zinc-400 text-sm">
                              {lang?.label ?? t.language}
                              <span className="ml-2 text-zinc-600 text-xs">({t.language})</span>
                            </div>
                            <input
                              value={t.value}
                              onChange={(e) => setTranslationValue(t.language, e.target.value)}
                              placeholder={`${draft.name} auf ${lang?.label ?? t.language}`}
                              className="w-full rounded-2xl border border-zinc-800 bg-black px-5 py-3 text-white outline-none focus:border-zinc-600 transition"
                            />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-zinc-800 p-5 text-zinc-500">
                      Erst einen gültigen Key eingeben (z.B. <span className="text-zinc-300">holiday.wiehnacht</span>) um Übersetzungen zu verwalten.
                    </div>
                  )}
                </div>

                {/* Buttons */}
                <div className="mt-8 flex gap-4">
                  <button onClick={saveItem} disabled={saving}
                    className={["rounded-full px-8 py-4 text-xl transition", saving ? "cursor-not-allowed bg-zinc-300 text-black opacity-70" : "bg-white text-black hover:opacity-90"].join(" ")}>
                    {saving ? "Speichere..." : "Speichern"}
                  </button>
                  <button onClick={deleteItem} disabled={saving}
                    className={["rounded-full border px-8 py-4 text-xl transition", saving ? "cursor-not-allowed border-zinc-800 text-zinc-600" : "border-zinc-700 text-white hover:border-zinc-500"].join(" ")}>
                    Löschen
                  </button>
                </div>

                {saved && <div className="mt-4 text-green-400">✓ gspeicheret</div>}

                {/* Vorschau */}
                <div className="mt-10 rounded-[1.75rem] border border-zinc-800 p-6">
                  <div className="mb-4 text-xs uppercase tracking-[0.35em] text-zinc-500">Vorschau</div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-4 h-4 rounded-full ${activeColor.bg}`} />
                    <div className={`text-sm uppercase tracking-[0.2em] ${activeColor.text}`}>{activeColor.label}</div>
                  </div>
                  <div className="text-sm uppercase tracking-[0.2em] text-zinc-500">{draft.key || "kein key"}</div>
                  <div className="mt-3 text-6xl font-semibold">{draft.text || draft.name || "—"}</div>
                  <div className="mt-4 text-xl text-zinc-400">{draft.date}</div>
                  <div className="mt-2 text-zinc-500">Status: {draft.active ? "aktiv" : "inaktiv"}</div>
                </div>
              </>
            ) : (
              <div className="text-zinc-500">Wähl links e Feiertag us.</div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}