"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type TranslationCategory = "weekday" | "month" | "day" | "year" | "holiday";

type Item = {
  id: string;
  key: string;
  value: string;
  category: TranslationCategory;
  language: string;
};

type LanguageOption = {
  code: string;
  label: string;
};

const categoryLabels: Record<TranslationCategory, string> = {
  weekday: "Wochentäg",
  month: "Monet",
  day: "Tageszahle",
  year: "Jahr",
  holiday: "Feiertag-Begriffe",
};

const categoryOrder: TranslationCategory[] = ["weekday", "month", "day", "year", "holiday"];

const keyLabels: Record<string, string> = {
  monday: "Montag", tuesday: "Dienstag", wednesday: "Mittwoch",
  thursday: "Donnerstag", friday: "Freitag", saturday: "Samstag", sunday: "Sonntag",
  january: "Januar", february: "Februar", march: "März", april: "April",
  may: "Mai", june: "Juni", july: "Juli", august: "August",
  september: "September", october: "Oktober", november: "November", december: "Dezember",
  easter: "Ostern", christmas: "Weihnacht", new_year: "Neujahr",
  new_year_eve: "Silvester", good_friday: "Karfreitag", easter_monday: "Ostermontag",
  ascension: "Auffahrt", whit_sunday: "Pfingsten", whit_monday: "Pfingstmontag",
  swiss_national: "Bundesfeiertag", assumption: "Mariä Himmelfahrt",
  all_saints: "Allerheiligen", christmas_eve: "Heiligabend",
  christmas_second: "Stephanstag", jahraestagg: "Jahräs Tag",
  national_day: "Nationalfeiertag", boxing_day: "Stephanstag",
  labour_day: "Tag der Arbeit", easter_sunday: "Ostersonntag",
};

const sortOrders: Record<TranslationCategory, string[]> = {
  weekday: ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"],
  month: ["january","february","march","april","may","june","july","august","september","october","november","december"],
  day: ["1","2","3","4","5","6","7","8","9","10","11","12","13","14","15","16","17","18","19","20","21","22","23","24","25","26","27","28","29","30","31"],
  year: ["2025","2026","2027","2028","2029","2030"],
  holiday: ["new_year","good_friday","easter","easter_monday","ascension","whit_sunday","whit_monday","national_day","assumption","all_saints","christmas_eve","christmas","boxing_day","new_year_eve","jahraestagg"],
};

function prettyKey(key: string, category?: TranslationCategory) {
  if (category === "day") return `Tag ${key}`;
  if (category === "year") return `Jahr ${key}`;
  return keyLabels[key] ?? key;
}

export default function TranslationsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [languages, setLanguages] = useState<LanguageOption[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [category, setCategory] = useState<TranslationCategory>("weekday");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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

  useEffect(() => {
    if (!selectedLanguage) return;
    loadItems();
  }, [selectedLanguage]);

  // Nur bei Kategorie-Wechsel zurücksetzen, NICHT bei items-Änderung
  useEffect(() => {
    setSelectedId(prev => {
      const filtered = getFilteredItemsRaw(items, category, selectedLanguage);
      // Wenn aktuell ausgewähltes Item noch in neuer Kategorie existiert, behalten
      if (prev && filtered.some(i => i.id === prev)) return prev;
      return filtered[0]?.id ?? null;
    });
  }, [category]);

  async function loadItems() {
    setLoading(true);
    const { data, error } = await supabase
      .from("translations")
      .select("*")
      .eq("language", selectedLanguage);
    if (error) { console.error("Fehler:", error); setLoading(false); return; }
    setItems((data ?? []) as Item[]);
    setLoading(false);
  }

  function getFilteredItemsRaw(all: Item[], cat: TranslationCategory, lang: string) {
    const order = sortOrders[cat] ?? [];
    return all
      .filter(item => item.category === cat && item.language === lang)
      .sort((a, b) => {
        const ai = order.indexOf(a.key), bi = order.indexOf(b.key);
        if (ai === -1 && bi === -1) return prettyKey(a.key, cat).localeCompare(prettyKey(b.key, cat), "de-CH");
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
      });
  }

  function getFilteredItems(all: Item[], cat: TranslationCategory) {
    return getFilteredItemsRaw(all, cat, selectedLanguage);
  }

  const filteredItems = getFilteredItems(items, category);
  const draft = filteredItems.find(item => item.id === selectedId) ?? null;
  const selectedLang = languages.find(l => l.code === selectedLanguage);

  function setDraft(updated: Item) {
    setItems(prev => prev.map(i => i.id === updated.id ? updated : i));
  }

  async function createNewItem() {
    const { data, error } = await supabase
      .from("translations")
      .insert([{ category, key: "", value: "", language: selectedLanguage }])
      .select();
    if (error) { alert(`Fehler: ${error.message}`); return; }
    const created = data?.[0] as Item;
    if (!created) return;
    setItems(prev => [...prev, created]);
    setSelectedId(created.id);
  }

  async function saveItem() {
    if (!draft) return;
    if (!draft.key.trim()) { alert("Bitte einen Schlüssel eingeben."); return; }
    setSaving(true);
    const currentId = draft.id;
    const { error } = await supabase
      .from("translations")
      .update({ key: draft.key.trim(), value: draft.value, category: draft.category, language: draft.language })
      .eq("id", currentId);
    setSaving(false);
    if (error) { alert(`Fehler: ${error.message}`); return; }
    // selectedId beibehalten!
    setSelectedId(currentId);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  async function deleteItem() {
    if (!draft) return;
    if (!confirm(`«${prettyKey(draft.key, category)}» wirklich löschen?`)) return;
    const { error } = await supabase.from("translations").delete().eq("id", draft.id);
    if (error) { console.error("Fehler:", error); return; }
    const remaining = items.filter(i => i.id !== draft.id);
    setItems(remaining);
    setSelectedId(getFilteredItems(remaining, category)[0]?.id ?? null);
  }

  return (
    <div className="text-white">
      <div className="mb-8">
        <div className="text-xs tracking-[0.35em] uppercase text-zinc-400 mb-2">Admin</div>
        <h1 className="text-5xl font-semibold tracking-tight">Begriffe verwalte</h1>
        <p className="text-zinc-400 mt-3">Änderige wärde direkt i Supabase gspeicheret.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-8">
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

        <div className="w-px h-5 bg-zinc-800" />

        {categoryOrder.map(key => {
          const active = key === category;
          return (
            <button key={key} onClick={() => setCategory(key)}
              className={["rounded-full border px-5 py-2 text-sm transition",
                active ? "bg-white text-black border-white" : "bg-transparent text-white border-zinc-700 hover:border-zinc-500"].join(" ")}>
              {categoryLabels[key]}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="text-zinc-500">Lade...</div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[360px_minmax(0,1fr)] gap-6">

          <section className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-3xl font-semibold">{categoryLabels[category]}</h2>
                <div className="text-xs text-zinc-500 mt-1">
                  {selectedLang?.label} · {filteredItems.length} Einträge
                </div>
              </div>
              <button onClick={createNewItem} className="rounded-full bg-white text-black px-5 py-3">Neu</button>
            </div>

            <div className="space-y-3">
              {filteredItems.map(item => {
                const active = item.id === selectedId;
                return (
                  <button key={item.id} onClick={() => setSelectedId(item.id)}
                    className={["w-full rounded-[1.5rem] border px-5 py-4 text-left transition",
                      active ? "bg-zinc-100 text-black border-zinc-100" : "bg-transparent text-white border-zinc-800 hover:border-zinc-600"].join(" ")}>
                    <div className="text-lg font-medium">{prettyKey(item.key, category)}</div>
                    <div className={active ? "text-zinc-600 mt-1 text-sm" : "text-zinc-400 mt-1 text-sm"}>
                      {item.value || "—"}
                    </div>
                  </button>
                );
              })}
              {filteredItems.length === 0 && (
                <div className="text-zinc-500">Keine Einträge in dieser Kategorie.</div>
              )}
            </div>
          </section>

          <section className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-8">
            {draft ? (
              <>
                <h2 className="text-4xl font-semibold mb-8">Begriff bearbeite</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <label className="block">
                    <div className="text-zinc-400 mb-2">Kategorie</div>
                    <input value={categoryLabels[draft.category]} disabled
                      className="w-full rounded-2xl border border-zinc-800 bg-black px-5 py-4 text-white outline-none opacity-60" />
                  </label>

                  <label className="block">
                    <div className="text-zinc-400 mb-2">Schlüssel</div>
                    <input value={draft.key} onChange={(e) => setDraft({ ...draft, key: e.target.value })}
                      placeholder="z. B. new_year"
                      className="w-full rounded-2xl border border-zinc-800 bg-black px-5 py-4 text-white outline-none" />
                    <div className="mt-2 text-sm text-zinc-500">
                      z.B. <span className="text-zinc-300">jahraestagg</span>
                    </div>
                  </label>

                  <label className="block md:col-span-2">
                    <div className="text-zinc-400 mb-2">Anzeigetext</div>
                    <input value={draft.value} onChange={(e) => setDraft({ ...draft, value: e.target.value })}
                      className="w-full rounded-2xl border border-zinc-800 bg-black px-5 py-4 text-white outline-none"
                      placeholder="z. B. äs isch Jahräs Tag" />
                  </label>
                </div>

                <div className="flex gap-4 mt-8">
                  <button onClick={saveItem} disabled={saving}
                    className={["rounded-full px-8 py-4 text-xl transition",
                      saving ? "bg-zinc-300 text-black opacity-70 cursor-not-allowed" : "bg-white text-black hover:opacity-90"].join(" ")}>
                    {saving ? "Speichere..." : "Speichern"}
                  </button>
                  <button onClick={deleteItem} disabled={saving}
                    className={["rounded-full border px-8 py-4 text-xl transition",
                      saving ? "border-zinc-800 text-zinc-600 cursor-not-allowed" : "border-zinc-700 text-white hover:border-zinc-500"].join(" ")}>
                    Löschen
                  </button>
                </div>

                {saved && <div className="mt-4 text-green-400">✓ gspeicheret</div>}

                <div className="mt-10 rounded-[1.75rem] border border-zinc-800 p-6">
                  <div className="text-xs tracking-[0.35em] uppercase text-zinc-500 mb-4">Vorschau</div>
                  <div className="text-6xl font-semibold">{draft.value || "—"}</div>
                  <div className="text-zinc-400 mt-4 text-xl">{prettyKey(draft.key, category)}</div>
                  <div className="text-zinc-500 mt-2">{selectedLang?.label} ({draft.language})</div>
                </div>
              </>
            ) : (
              <div className="text-zinc-500">Wähl links en Begriff us.</div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}