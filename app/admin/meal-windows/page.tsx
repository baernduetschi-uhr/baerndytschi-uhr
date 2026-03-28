"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type MealWindow = {
  id: string;
  key: string | null;
  label: string;
  from: string;
  to: string;
  active: boolean;
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
  "meal.breakfast",
  "meal.midmorning",
  "meal.lunch",
  "meal.afternoon",
  "meal.dinner",
];

function extractMealKey(key: string | null): string | null {
  if (!key) return null;
  if (!key.startsWith("meal.")) return null;
  return key.slice("meal.".length).trim() || null;
}

function formatTimeValue(value: string) {
  return value.slice(0, 5);
}

function normalizeTimeInput(value: string) {
  return value.length === 5 ? `${value}:00` : value;
}

export default function MealWindowsPage() {
  const [items, setItems] = useState<MealWindow[]>([]);
  const [languages, setLanguages] = useState<LanguageOption[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [translations, setTranslations] = useState<TranslationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      const [mealsResult, langsResult] = await Promise.all([
        supabase.from("meal_windows").select("*").order("from", { ascending: true }),
        supabase.from("languages").select("code, label").eq("active", true).order("label", { ascending: true }),
      ]);
      const rows = (mealsResult.data ?? []) as MealWindow[];
      setItems(rows);
      setLanguages((langsResult.data ?? []) as LanguageOption[]);
      setSelectedId(rows[0]?.id ?? null);
      setLoading(false);
    }
    loadAll();
  }, []);

  // Übersetzungen laden wenn Zytfänschter gewechselt
  useEffect(() => {
    if (!selectedId) return;
    const meal = items.find(i => i.id === selectedId);
    if (!meal) return;

    const tKey = extractMealKey(meal.key);
    if (!tKey) {
      setTranslations(languages.map(l => ({ language: l.code, value: "" })));
      return;
    }

    async function loadTranslations() {
      const { data } = await supabase
        .from("translations")
        .select("language, value")
        .eq("category", "meal")
        .eq("key", tKey!);

      const existing = (data ?? []) as TranslationRow[];
      const existingMap = new Map(existing.map(t => [t.language, t.value]));
      setTranslations(languages.map(l => ({
        language: l.code,
        value: existingMap.get(l.code) ?? "",
      })));
    }
    loadTranslations();
  }, [selectedId, items, languages]);

  const draft = items.find(i => i.id === selectedId) ?? null;

  function setDraft(updated: MealWindow) {
    setItems(prev => prev.map(i => i.id === updated.id ? updated : i));
  }

  function setTranslationValue(language: string, value: string) {
    setTranslations(prev => prev.map(t => t.language === language ? { ...t, value } : t));
  }

  async function createNewItem() {
    const newItem = {
      key: "meal.new_window",
      label: "Neus Zytfänschter",
      from: "06:00:00",
      to: "07:00:00",
      active: true,
    };

    const { data, error } = await supabase.from("meal_windows").insert(newItem).select().single();
    if (error) { console.error("Fehler:", error); return; }

    const created = data as MealWindow;
    setItems(prev => [...prev, created].sort((a, b) => a.from.localeCompare(b.from)));
    setSelectedId(created.id);
  }

  async function saveItem() {
    if (!draft) return;
    setSaving(true);

    // 1. Zytfänschter speichern
    const { error } = await supabase
      .from("meal_windows")
      .update({
        key: draft.key?.trim() || null,
        label: draft.label,
        from: draft.from,
        to: draft.to,
        active: draft.active,
      })
      .eq("id", draft.id);

    if (error) {
      console.error("Fehler:", error);
      setSaving(false);
      return;
    }

    // 2. Übersetzungen speichern
    const tKey = extractMealKey(draft.key);
    if (tKey) {
      const rows = translations
        .filter(t => t.value.trim())
        .map(t => ({ category: "meal", key: tKey, value: t.value.trim(), language: t.language }));

      if (rows.length > 0) {
        await supabase.from("translations").upsert(rows, { onConflict: "language,category,key" });
      }
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
    setItems(prev => [...prev].sort((a, b) => a.from.localeCompare(b.from)));
  }

  async function deleteItem() {
    if (!draft) return;
    const confirmed = confirm(`Zytfänschter «${draft.label}» wirklich löschen?`);
    if (!confirmed) return;

    const tKey = extractMealKey(draft.key);
    if (tKey) {
      await supabase.from("translations").delete().eq("category", "meal").eq("key", tKey);
    }

    const { error } = await supabase.from("meal_windows").delete().eq("id", draft.id);
    if (error) { console.error("Fehler:", error); return; }

    const remaining = items.filter(i => i.id !== draft.id);
    setItems(remaining);
    setSelectedId(remaining[0]?.id ?? null);
  }

  return (
    <div className="text-white">
      <div className="mb-8">
        <div className="mb-2 text-xs uppercase tracking-[0.35em] text-zinc-400">Admin</div>
        <h1 className="text-5xl font-semibold tracking-tight">Zytfänschter verwalte</h1>
        <p className="mt-3 text-zinc-400">Änderige wärde direkt i Supabase gspeicheret.</p>
      </div>

      {loading ? (
        <div className="text-zinc-500">Lade...</div>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">

          {/* Linke Liste */}
          <section className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-5">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-3xl font-semibold">Zytfänschter</h2>
              <button onClick={createNewItem} className="rounded-full bg-white px-5 py-3 text-black">Neu</button>
            </div>

            <div className="space-y-4">
              {items.map(item => {
                const active = item.id === selectedId;
                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    className={["w-full rounded-[1.5rem] border px-5 py-4 text-left transition",
                      active ? "border-zinc-100 bg-zinc-100 text-black" : "border-zinc-800 bg-transparent text-white hover:border-zinc-600"].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-2xl font-medium">{item.label || item.key || "—"}</div>
                        {item.key && (
                          <div className="mt-1 text-xs uppercase tracking-[0.18em] text-zinc-500">{item.key}</div>
                        )}
                        <div className={active ? "mt-2 text-zinc-600" : "mt-2 text-zinc-400"}>
                          {formatTimeValue(item.from)} – {formatTimeValue(item.to)}
                        </div>
                      </div>
                      <div className={["rounded-full px-3 py-1 text-sm",
                        active ? "bg-zinc-300 text-zinc-900" : "bg-zinc-800 text-zinc-300"].join(" ")}>
                        {item.active ? "aktiv" : "inaktiv"}
                      </div>
                    </div>
                  </button>
                );
              })}
              {items.length === 0 && <div className="text-zinc-500">No kei Zytfänschter vorhanden.</div>}
            </div>
          </section>

          {/* Rechts: Bearbeiten */}
          <section className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-8">
            {draft ? (
              <>
                <h2 className="mb-8 text-4xl font-semibold">Zytfänschter bearbeite</h2>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  {/* Key */}
                  <label className="block md:col-span-2">
                    <div className="mb-2 text-zinc-400">Interner Key</div>
                    <input
                      value={draft.key ?? ""}
                      onChange={(e) => setDraft({ ...draft, key: e.target.value })}
                      list="meal-key-suggestions"
                      placeholder="meal.breakfast"
                      className="w-full rounded-2xl border border-zinc-800 bg-black px-5 py-4 text-white outline-none"
                    />
                    <datalist id="meal-key-suggestions">
                      {KEY_SUGGESTIONS.map(k => <option key={k} value={k} />)}
                    </datalist>
                    <div className="mt-2 text-sm text-zinc-500">
                      Format: <span className="text-zinc-300">meal.name</span> — wird für Übersetzungen verwendet
                    </div>
                  </label>

                  {/* Fallback Label */}
                  <label className="block md:col-span-2">
                    <div className="mb-2 text-zinc-400">Fallback-Bezeichnung</div>
                    <input
                      value={draft.label}
                      onChange={(e) => setDraft({ ...draft, label: e.target.value })}
                      className="w-full rounded-2xl border border-zinc-800 bg-black px-5 py-4 text-white outline-none"
                    />
                    <div className="mt-2 text-sm text-zinc-500">
                      Wird angezeigt falls keine Übersetzung vorhanden ist.
                    </div>
                  </label>

                  {/* Zeit */}
                  <label className="block">
                    <div className="mb-2 text-zinc-400">Von</div>
                    <input type="time" value={formatTimeValue(draft.from)}
                      onChange={(e) => setDraft({ ...draft, from: normalizeTimeInput(e.target.value) })}
                      className="w-full rounded-2xl border border-zinc-800 bg-black px-5 py-4 text-white outline-none" />
                  </label>

                  <label className="block">
                    <div className="mb-2 text-zinc-400">Bis</div>
                    <input type="time" value={formatTimeValue(draft.to)}
                      onChange={(e) => setDraft({ ...draft, to: normalizeTimeInput(e.target.value) })}
                      className="w-full rounded-2xl border border-zinc-800 bg-black px-5 py-4 text-white outline-none" />
                  </label>

                  {/* Aktiv */}
                  <label className="mt-2 flex items-center gap-3 md:col-span-2">
                    <input type="checkbox" checked={draft.active}
                      onChange={(e) => setDraft({ ...draft, active: e.target.checked })} />
                    <span className="text-zinc-300">Aktiv</span>
                  </label>
                </div>

                {/* Übersetzungen */}
                <div className="mt-8">
                  <h3 className="text-2xl font-semibold mb-4">Übersetzungen</h3>
                  <p className="text-sm text-zinc-500 mb-5">
                    Text der pro Sprache auf der Uhr erscheint wenn dieses Zytfänschter aktiv ist.
                  </p>

                  {extractMealKey(draft.key) ? (
                    <div className="grid gap-4">
                      {translations.map(t => {
                        const lang = languages.find(l => l.code === t.language);
                        return (
                          <div key={t.language} className="grid grid-cols-[140px_minmax(0,1fr)] gap-4 items-center">
                            <div className="text-zinc-400 text-sm">
                              {lang?.label ?? t.language}
                              <span className="ml-2 text-zinc-600 text-xs">({t.language})</span>
                            </div>
                            <input
                              value={t.value}
                              onChange={(e) => setTranslationValue(t.language, e.target.value)}
                              placeholder={`${draft.label} auf ${lang?.label ?? t.language}`}
                              className="w-full rounded-2xl border border-zinc-800 bg-black px-5 py-3 text-white outline-none"
                            />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-zinc-800 p-5 text-zinc-500">
                      Erst einen gültigen Key eingeben (z.B. <span className="text-zinc-300">meal.breakfast</span>) um Übersetzungen zu verwalten.
                    </div>
                  )}
                </div>

                {/* Buttons */}
                <div className="mt-8 flex gap-4">
                  <button onClick={saveItem} disabled={saving}
                    className={["rounded-full px-8 py-4 text-xl transition",
                      saving ? "cursor-not-allowed bg-zinc-300 text-black opacity-70" : "bg-white text-black hover:opacity-90"].join(" ")}>
                    {saving ? "Speichere..." : "Speichern"}
                  </button>
                  <button onClick={deleteItem} disabled={saving}
                    className={["rounded-full border px-8 py-4 text-xl transition",
                      saving ? "cursor-not-allowed border-zinc-800 text-zinc-600" : "border-zinc-700 text-white hover:border-zinc-500"].join(" ")}>
                    Löschen
                  </button>
                </div>

                {saved && <div className="mt-4 text-green-400">✓ gspeicheret</div>}

                {/* Vorschau */}
                <div className="mt-10 rounded-[1.75rem] border border-zinc-800 p-6">
                  <div className="mb-4 text-xs uppercase tracking-[0.35em] text-zinc-500">Vorschau</div>
                  <div className="text-sm uppercase tracking-[0.2em] text-zinc-500">{draft.key || "kein key"}</div>
                  <div className="mt-3 text-6xl font-semibold">{draft.label || "—"}</div>
                  <div className="mt-4 text-xl text-zinc-400">{formatTimeValue(draft.from)} – {formatTimeValue(draft.to)}</div>
                  <div className="mt-2 text-zinc-500">Status: {draft.active ? "aktiv" : "inaktiv"}</div>
                </div>
              </>
            ) : (
              <div className="text-zinc-500">Wähl links es Zytfänschter us.</div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}