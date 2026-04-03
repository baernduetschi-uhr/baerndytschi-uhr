"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Birthday = {
  id: string;
  name: string;
  date: string; // MM-DD
  active: boolean;
  display_word_key: string | null;
  color: string;
  created_at: string;
};

type DisplayWord = {
  id: string;
  category: string;
  key: string;
  active: boolean;
};

const MONTHS = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];

const COLORS = [
  { value: "pink", label: "Rosa", bg: "bg-pink-500", border: "border-pink-400", text: "text-pink-300", preview: "#ec4899" },
  { value: "blue", label: "Blau", bg: "bg-blue-500", border: "border-blue-400", text: "text-blue-300", preview: "#3b82f6" },
  { value: "red", label: "Rot", bg: "bg-red-500", border: "border-red-400", text: "text-red-300", preview: "#ef4444" },
];

function formatDate(date: string): string {
  const [mm, dd] = date.split("-");
  return `${parseInt(dd)}. ${MONTHS[parseInt(mm) - 1]}`;
}

function todayMMDD(): string {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${mm}-${dd}`;
}

function colorDot(color: string) {
  const c = COLORS.find(c => c.value === color);
  if (!c) return null;
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${c.bg} mr-1.5`} />;
}

export default function BirthdaysPage() {
  const [items, setItems] = useState<Birthday[]>([]);
  const [displayWords, setDisplayWords] = useState<DisplayWord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      const [birthdaysResult, wordsResult] = await Promise.all([
        supabase.from("birthdays").select("*").order("date", { ascending: true }),
        supabase.from("display_words").select("*").eq("active", true).order("category").order("key"),
      ]);
      const rows = (birthdaysResult.data ?? []) as Birthday[];
      setItems(rows);
      setDisplayWords((wordsResult.data ?? []) as DisplayWord[]);
      setSelectedId(rows[0]?.id ?? null);
      setLoading(false);
    }
    loadAll();
  }, []);

  const draft = items.find((i) => i.id === selectedId) ?? null;

  // Kategorie initialisieren wenn draft wechselt
  useEffect(() => {
    if (!draft) return;
    if (draft.display_word_key) {
      const word = displayWords.find(w => w.key === draft.display_word_key);
      setSelectedCategory(word?.category ?? "");
    } else {
      setSelectedCategory("");
    }
  }, [selectedId]);

  function setDraft(updated: Birthday) {
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  }

  // Kategorien und gefilterte Wörter
  const categories = [...new Set(displayWords.map(w => w.category))];
  const filteredWords = selectedCategory
    ? displayWords.filter(w => w.category === selectedCategory)
    : [];

  async function createNewItem() {
    const newItem = {
      name: "Neuer Geburtstag",
      date: todayMMDD(),
      active: true,
      display_word_key: null,
      color: "pink",
    };
    const { data, error } = await supabase
      .from("birthdays")
      .insert(newItem)
      .select()
      .single();
    if (error) { console.error("Fehler:", error); return; }
    const created = data as Birthday;
    setItems((prev) => [...prev, created].sort((a, b) => a.date.localeCompare(b.date)));
    setSelectedId(created.id);
    setSelectedCategory("");
  }

  async function saveItem() {
    if (!draft) return;
    setSaving(true);
    const { error } = await supabase
      .from("birthdays")
      .update({
        name: draft.name,
        date: draft.date,
        active: draft.active,
        display_word_key: draft.display_word_key || null,
        color: draft.color,
      })
      .eq("id", draft.id);
    setSaving(false);
    if (error) { console.error("Fehler:", error); alert(`Fehler: ${error.message}`); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
    setItems((prev) => [...prev].sort((a, b) => a.date.localeCompare(b.date)));
  }

  async function deleteItem() {
    if (!draft) return;
    const confirmed = confirm(`Geburtstag «${draft.name}» wirklich löschen?`);
    if (!confirmed) return;
    const { error } = await supabase.from("birthdays").delete().eq("id", draft.id);
    if (error) { console.error("Fehler:", error); return; }
    const remaining = items.filter((i) => i.id !== draft.id);
    setItems(remaining);
    setSelectedId(remaining[0]?.id ?? null);
  }

  const today = todayMMDD();
  const activeColor = COLORS.find(c => c.value === (draft?.color ?? "pink")) ?? COLORS[0];

  return (
    <div className="text-white">
      <div className="mb-8">
        <div className="mb-2 text-xs uppercase tracking-[0.35em] text-zinc-400">Admin</div>
        <h1 className="text-5xl font-semibold tracking-tight">Geburtstage verwalte</h1>
        <p className="mt-3 text-zinc-400">Widerkerendi Geburtstäg — wärde jedes Jahr am glyche Dag aagzeigt.</p>
      </div>

      {loading ? (
        <div className="text-zinc-500">Lade...</div>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">

          {/* Liste */}
          <section className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-semibold">Geburtstäg</h2>
                <p className="text-zinc-500 text-sm mt-1">{items.length} Einträge</p>
              </div>
              <button
                onClick={createNewItem}
                className="rounded-full bg-white px-5 py-3 text-black font-medium hover:opacity-90 transition"
              >
                Neu
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item) => {
                const active = item.id === selectedId;
                const isToday = item.date === today;
                const color = COLORS.find(c => c.value === item.color) ?? COLORS[0];
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
                      <div className="flex items-center text-xl font-medium">
                        {colorDot(item.color)}
                        {item.name}
                      </div>
                      <div className="flex gap-2">
                        {isToday && (
                          <span className={[
                            "rounded-full px-3 py-1 text-xs font-medium",
                            active ? "bg-yellow-400 text-black" : "bg-yellow-500/20 text-yellow-400",
                          ].join(" ")}>
                            🎂 Hüt
                          </span>
                        )}
                        <span className={[
                          "rounded-full px-3 py-1 text-xs",
                          active ? "bg-zinc-300 text-zinc-900" : "bg-zinc-800 text-zinc-400",
                        ].join(" ")}>
                          {item.active ? "aktiv" : "inaktiv"}
                        </span>
                      </div>
                    </div>
                    <div className={active ? "mt-1 text-zinc-600" : "mt-1 text-zinc-400"}>
                      {formatDate(item.date)} — jedes Jahr
                    </div>
                  </button>
                );
              })}
              {items.length === 0 && (
                <div className="text-zinc-500">No kei Geburtstäg vorhanden.</div>
              )}
            </div>
          </section>

          {/* Bearbeiten */}
          <section className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-8">
            {draft ? (
              <>
                <h2 className="mb-8 text-4xl font-semibold">Geburtstag bearbeite</h2>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                  {/* Name */}
                  <label className="block md:col-span-2">
                    <div className="mb-2 text-zinc-400">Name</div>
                    <input
                      value={draft.name}
                      onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                      placeholder="z.B. Mama"
                      className="w-full rounded-2xl border border-zinc-800 bg-black px-5 py-4 text-white outline-none focus:border-zinc-600 transition"
                    />
                    <div className="mt-2 text-sm text-zinc-500">Bliibt glych i allne Sprache</div>
                  </label>

                  {/* Farbe */}
                  <div className="md:col-span-2">
                    <div className="mb-3 text-zinc-400">Farb</div>
                    <div className="flex gap-4">
                      {COLORS.map(color => (
                        <label key={color.value} className="flex items-center gap-2 cursor-pointer">
                          <div className={[
                            "w-6 h-6 rounded-full border-2 flex items-center justify-center transition",
                            draft.color === color.value
                              ? `${color.bg} ${color.border}`
                              : "border-zinc-600 bg-transparent",
                          ].join(" ")}
                            onClick={() => setDraft({ ...draft, color: color.value })}
                          >
                            {draft.color === color.value && (
                              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                <path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </div>
                          <span className={draft.color === color.value ? color.text : "text-zinc-400"}>
                            {color.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Kategorie Dropdown */}
                  <label className="block">
                    <div className="mb-2 text-zinc-400">Kategorie</div>
                    <select
                      value={selectedCategory}
                      onChange={(e) => {
                        setSelectedCategory(e.target.value);
                        setDraft({ ...draft, display_word_key: null });
                      }}
                      className="w-full rounded-2xl border border-zinc-800 bg-black px-5 py-4 text-white outline-none focus:border-zinc-600 transition cursor-pointer"
                    >
                      <option value="">— Kategorie wähle —</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </label>

                  {/* Anzeigewort Dropdown */}
                  <label className="block">
                    <div className="mb-2 text-zinc-400">Anzeigewort</div>
                    <select
                      value={draft.display_word_key ?? ""}
                      onChange={(e) => setDraft({ ...draft, display_word_key: e.target.value || null })}
                      disabled={!selectedCategory}
                      className={[
                        "w-full rounded-2xl border border-zinc-800 bg-black px-5 py-4 text-white outline-none focus:border-zinc-600 transition",
                        !selectedCategory ? "opacity-40 cursor-not-allowed" : "cursor-pointer",
                      ].join(" ")}
                    >
                      <option value="">— Anzeigewort wähle —</option>
                      {filteredWords.map(w => (
                        <option key={w.key} value={w.key}>{w.key}</option>
                      ))}
                    </select>
                    <div className="mt-2 text-sm text-zinc-500">
                      Übersetzung wird automatisch übernommen
                    </div>
                  </label>

                  {/* Monat */}
                  <label className="block">
                    <div className="mb-2 text-zinc-400">Monat</div>
                    <select
                      value={draft.date.split("-")[0]}
                      onChange={(e) => {
                        const dd = draft.date.split("-")[1];
                        setDraft({ ...draft, date: `${e.target.value}-${dd}` });
                      }}
                      className="w-full rounded-2xl border border-zinc-800 bg-black px-5 py-4 text-white outline-none focus:border-zinc-600 transition cursor-pointer"
                    >
                      {MONTHS.map((m, i) => (
                        <option key={i} value={String(i + 1).padStart(2, "0")}>{m}</option>
                      ))}
                    </select>
                  </label>

                  {/* Tag */}
                  <label className="block">
                    <div className="mb-2 text-zinc-400">Tag</div>
                    <input
                      type="number"
                      min={1}
                      max={31}
                      value={draft.date.split("-")[1] ? parseInt(draft.date.split("-")[1]) : 1}
                      onChange={(e) => {
                        const mm = draft.date.split("-")[0];
                        const dd = String(parseInt(e.target.value)).padStart(2, "0");
                        setDraft({ ...draft, date: `${mm}-${dd}` });
                      }}
                      className="w-full rounded-2xl border border-zinc-800 bg-black px-5 py-4 text-white outline-none focus:border-zinc-600 transition"
                    />
                  </label>

                  {/* Aktiv */}
                  <label className="mt-2 flex items-center gap-3 md:col-span-2">
                    <input
                      type="checkbox"
                      checked={draft.active}
                      onChange={(e) => setDraft({ ...draft, active: e.target.checked })}
                    />
                    <span className="text-zinc-300">Aktiv</span>
                  </label>
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
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-4 h-4 rounded-full ${activeColor.bg}`} />
                    <div className={`text-sm uppercase tracking-[0.2em] ${activeColor.text}`}>
                      {activeColor.label}
                    </div>
                  </div>
                  <div className="text-6xl font-semibold">🎂 {draft.name}</div>
                  {draft.display_word_key && (
                    <div className="mt-3 text-zinc-400 text-lg">{draft.display_word_key}</div>
                  )}
                  <div className="mt-4 text-xl text-zinc-400">{formatDate(draft.date)} — jedes Jahr</div>
                  <div className="mt-2 text-zinc-500">Status: {draft.active ? "aktiv" : "inaktiv"}</div>
                  {draft.date === today && (
                    <div className="mt-3 text-yellow-400 font-medium">🎉 Hüt isch Geburtstag!</div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-zinc-500">Wähl links en Geburtstag us.</div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}