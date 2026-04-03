"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type DisplayWord = {
  id: string;
  category: string;
  key: string;
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

export default function DisplayWordsPage() {
  const [items, setItems] = useState<DisplayWord[]>([]);
  const [languages, setLanguages] = useState<LanguageOption[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [translations, setTranslations] = useState<TranslationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      const [wordsResult, langsResult] = await Promise.all([
        supabase.from("display_words").select("*").order("category").order("key"),
        supabase.from("languages").select("code, label").eq("active", true).order("label"),
      ]);
      const rows = (wordsResult.data ?? []) as DisplayWord[];
      setItems(rows);
      setLanguages((langsResult.data ?? []) as LanguageOption[]);
      setSelectedId(rows[0]?.id ?? null);
      setLoading(false);
    }
    loadAll();
  }, []);

  // Übersetzungen laden wenn Wort gewechselt
  useEffect(() => {
    if (!selectedId) return;
    const word = items.find(i => i.id === selectedId);
    if (!word) return;

    async function loadTranslations() {
      const { data } = await supabase
        .from("translations")
        .select("language, value")
        .eq("category", "display_word")
        .eq("key", word!.key);

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

  function setDraft(updated: DisplayWord) {
    setItems(prev => prev.map(i => i.id === updated.id ? updated : i));
  }

  function setTranslationValue(language: string, value: string) {
    setTranslations(prev => prev.map(t => t.language === language ? { ...t, value } : t));
  }

  async function createNewItem() {
    const newItem = {
      category: "Geburi",
      key: `wort_${Date.now()}`,
      active: true,
    };
    const { data, error } = await supabase
      .from("display_words")
      .insert(newItem)
      .select()
      .single();
    if (error) { console.error("Fehler:", error); return; }
    const created = data as DisplayWord;
    setItems(prev => [...prev, created]);
    setSelectedId(created.id);
  }

  async function saveItem() {
    if (!draft) return;
    setSaving(true);

    // 1. display_word speichern
    const { error } = await supabase
      .from("display_words")
      .update({
        category: draft.category,
        key: draft.key,
        active: draft.active,
      })
      .eq("id", draft.id);

    if (error) {
      console.error("Fehler:", error);
      setSaving(false);
      return;
    }

    // 2. Übersetzungen speichern
    const rows = translations
      .filter(t => t.value.trim())
      .map(t => ({
        category: "display_word",
        key: draft.key,
        value: t.value.trim(),
        language: t.language,
      }));

    if (rows.length > 0) {
      await supabase
        .from("translations")
        .upsert(rows, { onConflict: "language,category,key" });
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  async function deleteItem() {
    if (!draft) return;
    const confirmed = confirm(`Anzeigewort «${draft.key}» wirklich löschen?`);
    if (!confirmed) return;

    await supabase.from("translations").delete()
      .eq("category", "display_word")
      .eq("key", draft.key);

    const { error } = await supabase.from("display_words").delete().eq("id", draft.id);
    if (error) { console.error("Fehler:", error); return; }

    const remaining = items.filter(i => i.id !== draft.id);
    setItems(remaining);
    setSelectedId(remaining[0]?.id ?? null);
  }

  // Kategorien gruppieren für Anzeige
  const categories = [...new Set(items.map(i => i.category))];

  return (
    <div className="text-white">
      <div className="mb-8">
        <div className="mb-2 text-xs uppercase tracking-[0.35em] text-zinc-400">Admin</div>
        <h1 className="text-5xl font-semibold tracking-tight">Anzeigewörter verwalte</h1>
        <p className="mt-3 text-zinc-400">
          Wörter und Beschreibige pro Sprach — z.B. "där Cousin vo Muätter Sitä".
        </p>
      </div>

      {loading ? (
        <div className="text-zinc-500">Lade...</div>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">

          {/* Liste */}
          <section className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-semibold">Wörter</h2>
                <p className="text-zinc-500 text-sm mt-1">{items.length} Einträge</p>
              </div>
              <button
                onClick={createNewItem}
                className="rounded-full bg-white px-5 py-3 text-black font-medium hover:opacity-90 transition"
              >
                Neu
              </button>
            </div>

            <div className="space-y-6">
              {categories.map(cat => (
                <div key={cat}>
                  <div className="text-xs uppercase tracking-[0.25em] text-zinc-500 mb-2 px-1">{cat}</div>
                  <div className="space-y-2">
                    {items.filter(i => i.category === cat).map(item => {
                      const active = item.id === selectedId;
                      // Erste Übersetzung als Vorschau
                      return (
                        <button
                          key={item.id}
                          onClick={() => setSelectedId(item.id)}
                          className={[
                            "w-full rounded-[1.5rem] border px-5 py-4 text-left transition",
                            active
                              ? "border-zinc-100 bg-zinc-100 text-black"
                              : "border-zinc-800 bg-transparent text-white hover:border-zinc-600",
                          ].join(" ")}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-base font-medium truncate">{item.key}</div>
                            <span className={[
                              "rounded-full px-3 py-1 text-xs shrink-0",
                              active ? "bg-zinc-300 text-zinc-900" : "bg-zinc-800 text-zinc-400",
                            ].join(" ")}>
                              {item.active ? "aktiv" : "inaktiv"}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              {items.length === 0 && (
                <div className="text-zinc-500">No kei Anzeigewörter vorhanden.</div>
              )}
            </div>
          </section>

          {/* Bearbeiten */}
          <section className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-8">
            {draft ? (
              <>
                <h2 className="mb-8 text-4xl font-semibold">Anzeigewort bearbeite</h2>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  {/* Kategorie */}
                  <label className="block">
                    <div className="mb-2 text-zinc-400">Kategorie</div>
                    <input
                      value={draft.category}
                      onChange={e => setDraft({ ...draft, category: e.target.value })}
                      placeholder="z.B. Geburi"
                      className="w-full rounded-2xl border border-zinc-800 bg-black px-5 py-4 text-white outline-none focus:border-zinc-600 transition"
                    />
                    <div className="mt-2 text-sm text-zinc-500">Gruppe — z.B. Geburi, Grüessli, usw.</div>
                  </label>

                  {/* Key */}
                  <label className="block">
                    <div className="mb-2 text-zinc-400">Schlüssel</div>
                    <input
                      value={draft.key}
                      onChange={e => setDraft({ ...draft, key: e.target.value })}
                      placeholder="z.B. cousin_mutter"
                      className="w-full rounded-2xl border border-zinc-800 bg-black px-5 py-4 text-white outline-none focus:border-zinc-600 transition"
                    />
                    <div className="mt-2 text-sm text-zinc-500">Eindeutiger Schlüssel — kei Leerzeeche</div>
                  </label>

                  {/* Aktiv */}
                  <label className="mt-2 flex items-center gap-3 md:col-span-2">
                    <input
                      type="checkbox"
                      checked={draft.active}
                      onChange={e => setDraft({ ...draft, active: e.target.checked })}
                    />
                    <span className="text-zinc-300">Aktiv</span>
                  </label>
                </div>

                {/* Übersetzungen */}
                <div className="mt-8">
                  <h3 className="text-2xl font-semibold mb-2">Übersetzungen</h3>
                  <p className="text-sm text-zinc-500 mb-5">
                    Text pro Sprach — z.B. "där Cousin vo Muätter Sitä" auf Bärndütsch.
                  </p>

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
                            onChange={e => setTranslationValue(t.language, e.target.value)}
                            placeholder={`Text uf ${lang?.label ?? t.language}`}
                            className="w-full rounded-2xl border border-zinc-800 bg-black px-5 py-3 text-white outline-none focus:border-zinc-600 transition"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Buttons */}
                <div className="mt-8 flex gap-4">
                  <button
                    onClick={saveItem}
                    disabled={saving}
                    className={[
                      "rounded-full px-8 py-4 text-xl transition",
                      saving
                        ? "cursor-not-allowed bg-zinc-300 text-black opacity-70"
                        : "bg-white text-black hover:opacity-90",
                    ].join(" ")}
                  >
                    {saving ? "Speichere..." : "Speichern"}
                  </button>
                  <button
                    onClick={deleteItem}
                    disabled={saving}
                    className={[
                      "rounded-full border px-8 py-4 text-xl transition",
                      saving
                        ? "cursor-not-allowed border-zinc-800 text-zinc-600"
                        : "border-zinc-700 text-white hover:border-zinc-500",
                    ].join(" ")}
                  >
                    Löschen
                  </button>
                </div>

                {saved && <div className="mt-4 text-green-400">✓ gspeicheret</div>}

                {/* Vorschau */}
                <div className="mt-10 rounded-[1.75rem] border border-zinc-800 p-6">
                  <div className="mb-4 text-xs uppercase tracking-[0.35em] text-zinc-500">Vorschau</div>
                  <div className="text-sm uppercase tracking-[0.2em] text-zinc-500 mb-2">{draft.category} · {draft.key}</div>
                  {translations.filter(t => t.value).slice(0, 3).map(t => {
                    const lang = languages.find(l => l.code === t.language);
                    return (
                      <div key={t.language} className="mt-3">
                        <div className="text-xs text-zinc-600 mb-1">{lang?.label ?? t.language}</div>
                        <div className="text-2xl font-medium text-white">{t.value}</div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="text-zinc-500">Wähl links es Anzeigewort us.</div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}