"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type LanguageItem = {
  code: string;
  label: string;
  active: boolean;
  is_default: boolean;
};

function Toggle({ checked, onChange }: { checked: boolean; onChange: (next: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={["relative inline-flex h-8 w-16 items-center rounded-full transition",
        checked ? "bg-white" : "bg-zinc-800"].join(" ")}
      aria-pressed={checked}
    >
      <span className={["inline-block h-6 w-6 transform rounded-full transition",
        checked ? "translate-x-9 bg-black" : "translate-x-1 bg-white"].join(" ")} />
    </button>
  );
}

export default function LanguagesPage() {
  const [items, setItems] = useState<LanguageItem[]>([]);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { loadItems(); }, []);

  async function loadItems() {
    setLoading(true);
    const { data, error } = await supabase
      .from("languages")
      .select("code, label, active, is_default")
      .order("label", { ascending: true });
    if (error) { console.error("Fehler:", error); setLoading(false); return; }
    const rows = (data ?? []) as LanguageItem[];
    setItems(rows);
    setSelectedCode(rows[0]?.code ?? null);
    setLoading(false);
  }

  const draft = items.find(item => item.code === selectedCode) ?? null;

  function setDraft(updated: LanguageItem) {
    setItems(prev => prev.map(item => item.code === updated.code ? updated : item));
  }

  async function createNewItem() {
    // Leere Sprache — Code muss manuell eingegeben werden
    const placeholder = `neu_${Date.now()}`;
    const { data, error } = await supabase
      .from("languages")
      .insert({ code: placeholder, label: "Neue Sprache", active: false, is_default: false })
      .select()
      .single();
    if (error) { console.error("Fehler:", error); return; }
    const created = data as LanguageItem;
    setItems(prev => [...prev, created].sort((a, b) => a.label.localeCompare(b.label)));
    setSelectedCode(created.code);
  }

  async function saveItem() {
    if (!draft) return;
    setSaving(true);

    // Wenn als Standard gesetzt → andere zurücksetzen
    if (draft.is_default) {
      await supabase.from("languages").update({ is_default: false }).neq("code", draft.code);
    }

    const { error } = await supabase
      .from("languages")
      .update({ code: draft.code, label: draft.label, active: draft.active, is_default: draft.is_default })
      .eq("code", selectedCode!);

    setSaving(false);
    if (error) { console.error("Fehler:", error); return; }

    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
    await loadItems();
    setSelectedCode(draft.code);
  }

  async function deleteItem() {
    if (!draft) return;
    if (!confirm(`Sprache «${draft.label}» (${draft.code}) wirklich löschen?`)) return;

    const { error } = await supabase.from("languages").delete().eq("code", draft.code);
    if (error) { console.error("Fehler:", error); return; }

    const remaining = items.filter(item => item.code !== draft.code);
    setItems(remaining);
    setSelectedCode(remaining[0]?.code ?? null);
  }

  return (
    <div className="text-white">
      <div className="mb-8">
        <div className="text-xs tracking-[0.35em] uppercase text-zinc-400 mb-2">Admin</div>
        <h1 className="text-5xl font-semibold tracking-tight">Sprachen verwalte</h1>
        <p className="text-zinc-400 mt-3">Aktivi und inaktivi Sprache verwalte.</p>
      </div>

      {loading ? (
        <div className="text-zinc-500">Lade...</div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[360px_minmax(0,1fr)] gap-6">

          {/* Liste */}
          <section className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-3xl font-semibold">Sprache</h2>
                <div className="text-xs text-zinc-500 mt-1">
                  {items.filter(i => i.active).length} aktiv · {items.length} total
                </div>
              </div>
              <button onClick={createNewItem} className="rounded-full bg-white text-black px-5 py-3">Neu</button>
            </div>

            <div className="space-y-3">
              {items.map(item => {
                const active = item.code === selectedCode;
                return (
                  <button
                    key={item.code}
                    onClick={() => setSelectedCode(item.code)}
                    className={["w-full rounded-[1.5rem] border px-5 py-4 text-left transition",
                      active ? "bg-zinc-100 text-black border-zinc-100" : "bg-transparent text-white border-zinc-800 hover:border-zinc-600"].join(" ")}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xl font-medium">{item.label}</div>
                        <div className={active ? "text-zinc-600 mt-0.5 text-sm" : "text-zinc-500 mt-0.5 text-sm"}>
                          {item.code}
                          {item.is_default && " · Standard"}
                        </div>
                      </div>
                      <span className={["text-xs px-3 py-1 rounded-full shrink-0",
                        item.active
                          ? active ? "bg-zinc-300 text-zinc-800" : "bg-green-400/10 text-green-400"
                          : active ? "bg-zinc-300 text-zinc-600" : "bg-zinc-800 text-zinc-500"].join(" ")}>
                        {item.active ? "aktiv" : "inaktiv"}
                      </span>
                    </div>
                  </button>
                );
              })}
              {items.length === 0 && <div className="text-zinc-500">Keine Sprachen vorhanden.</div>}
            </div>
          </section>

          {/* Bearbeiten */}
          <section className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-8">
            {draft ? (
              <>
                <h2 className="text-4xl font-semibold mb-8">Sprache bearbeite</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <label className="block">
                    <div className="text-zinc-400 mb-2">Code</div>
                    <input
                      value={draft.code}
                      onChange={(e) => setDraft({ ...draft, code: e.target.value.toLowerCase() })}
                      className="w-full rounded-2xl border border-zinc-800 bg-black px-5 py-4 text-white outline-none"
                      placeholder="z. B. be"
                    />
                    <div className="mt-2 text-sm text-zinc-500">Kurzcode — z.B. <span className="text-zinc-300">be</span>, <span className="text-zinc-300">rg</span></div>
                  </label>

                  <label className="block">
                    <div className="text-zinc-400 mb-2">Name</div>
                    <input
                      value={draft.label}
                      onChange={(e) => setDraft({ ...draft, label: e.target.value })}
                      className="w-full rounded-2xl border border-zinc-800 bg-black px-5 py-4 text-white outline-none"
                      placeholder="z. B. Bärndütsch"
                    />
                  </label>

                  <div className="rounded-[1.5rem] border border-zinc-800 p-5">
                    <div className="text-zinc-400 mb-3">Aktiv</div>
                    <div className="flex items-center gap-4">
                      <Toggle checked={draft.active} onChange={(next) => setDraft({ ...draft, active: next })} />
                      <span className="text-zinc-300">{draft.active ? "Ja — im Menü sichtbar" : "Nein — versteckt"}</span>
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] border border-zinc-800 p-5">
                    <div className="text-zinc-400 mb-3">Standardsprache</div>
                    <div className="flex items-center gap-4">
                      <Toggle checked={draft.is_default} onChange={(next) => setDraft({ ...draft, is_default: next })} />
                      <span className="text-zinc-300">{draft.is_default ? "Ja" : "Nein"}</span>
                    </div>
                    <div className="mt-2 text-xs text-zinc-600">Wird beim ersten Laden verwendet.</div>
                  </div>
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

                {/* Info */}
                <div className="mt-10 rounded-[1.75rem] border border-zinc-800 p-6">
                  <div className="text-xs tracking-[0.35em] uppercase text-zinc-500 mb-4">Info</div>
                  <div className="text-3xl font-semibold">{draft.label}</div>
                  <div className="text-zinc-500 mt-2">{draft.code.toUpperCase()}</div>
                  <div className="mt-3 flex gap-2 flex-wrap">
                    <span className={["text-xs px-3 py-1 rounded-full",
                      draft.active ? "bg-green-400/10 text-green-400" : "bg-zinc-800 text-zinc-500"].join(" ")}>
                      {draft.active ? "aktiv" : "inaktiv"}
                    </span>
                    {draft.is_default && (
                      <span className="text-xs px-3 py-1 rounded-full bg-white/10 text-white">Standard</span>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-zinc-500">Wähl links e Sprach us.</div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}