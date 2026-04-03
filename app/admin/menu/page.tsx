"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";

type Language = {
  code: string;
  label: string;
  active: boolean;
  group_name: string | null;
  region: string | null;
  sort_order: number;
};

type DragItem =
  | { type: "lang"; code: string }
  | { type: "region"; group: string; region: string }
  | { type: "group"; group: string };

function InlineEdit({ value, onSave, className }: { value: string; onSave: (v: string) => void; className?: string }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => { onSave(draft); setEditing(false); }}
        onKeyDown={(e) => {
          if (e.key === "Enter") { onSave(draft); setEditing(false); }
          if (e.key === "Escape") { setDraft(value); setEditing(false); }
        }}
        className="bg-transparent border-b border-white/40 outline-none text-white px-1"
        style={{ width: `${Math.max(draft.length + 2, 8)}ch` }}
        onClick={(e) => e.stopPropagation()}
      />
    );
  }
  return (
    <span
      onClick={(e) => { e.stopPropagation(); setDraft(value); setEditing(true); }}
      title="Umbenennen"
      className={[className, "cursor-text hover:opacity-60 transition-opacity"].join(" ")}
    >
      {value} <span className="opacity-25 text-xs">✎</span>
    </span>
  );
}

function DragHandle({ onDragStart }: { onDragStart: (e: React.DragEvent) => void }) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="cursor-grab active:cursor-grabbing text-zinc-600 hover:text-zinc-400 shrink-0 px-1"
      onClick={(e) => e.stopPropagation()}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
        <circle cx="4.5" cy="3.5" r="1.2"/><circle cx="9.5" cy="3.5" r="1.2"/>
        <circle cx="4.5" cy="7" r="1.2"/><circle cx="9.5" cy="7" r="1.2"/>
        <circle cx="4.5" cy="10.5" r="1.2"/><circle cx="9.5" cy="10.5" r="1.2"/>
      </svg>
    </div>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="12" height="12" viewBox="0 0 12 12" fill="none"
      style={{ transition: "transform 0.2s", transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
      className="text-zinc-500 shrink-0"
    >
      <path d="M4 2L8 6L4 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default function MenuPage() {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editingLang, setEditingLang] = useState<Language | null>(null);

  const [closedGroups, setClosedGroups] = useState<Set<string>>(new Set());
  const [closedRegions, setClosedRegions] = useState<Set<string>>(new Set());

  const dragItem = useRef<DragItem | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

  const [showNewGroup, setShowNewGroup] = useState(false);
  const [showNewRegion, setShowNewRegion] = useState(false);
  const [showNewSubRegion, setShowNewSubRegion] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newRegionGroup, setNewRegionGroup] = useState("");
  const [newRegionName, setNewRegionName] = useState("");
  const [newSubRegionGroup, setNewSubRegionGroup] = useState("");
  const [newSubRegionParent, setNewSubRegionParent] = useState("");
  const [newSubRegionName, setNewSubRegionName] = useState("");

  useEffect(() => { loadLanguages(); }, []);

  async function loadLanguages() {
    setLoading(true);
    const { data } = await supabase
      .from("languages")
      .select("code, label, active, group_name, region, sort_order")
      .order("sort_order", { ascending: true });
    setLanguages((data ?? []) as Language[]);
    setLoading(false);
  }

  type TreeNode = {
    group: string;
    regions: {
      region: string;
      subRegions: {
        subRegion: string;
        languages: Language[];
      }[];
      languages: Language[];
    }[];
  };

  function buildTree(): TreeNode[] {
    const groupMap = new Map<string, Map<string, Map<string, Language[]>>>();
    for (const lang of languages) {
      const group = lang.group_name ?? "Andere";
      const regionRaw = lang.region ?? "Andere";
      const parts = regionRaw.split("/");
      const region = parts[0].trim();
      const subRegion = parts[1]?.trim() ?? "__root__";
      if (!groupMap.has(group)) groupMap.set(group, new Map());
      const regionMap = groupMap.get(group)!;
      if (!regionMap.has(region)) regionMap.set(region, new Map());
      const subMap = regionMap.get(region)!;
      if (!subMap.has(subRegion)) subMap.set(subRegion, []);
      subMap.get(subRegion)!.push(lang);
    }
    return [...groupMap.entries()].map(([group, regionMap]) => ({
      group,
      regions: [...regionMap.entries()].map(([region, subMap]) => ({
        region,
        subRegions: [...subMap.entries()]
          .filter(([sr]) => sr !== "__root__")
          .map(([subRegion, langs]) => ({
            subRegion,
            languages: langs.sort((a, b) => a.sort_order - b.sort_order),
          })),
        languages: (subMap.get("__root__") ?? []).sort((a, b) => a.sort_order - b.sort_order),
      })),
    }));
  }

  const tree = buildTree();
  const allGroups = [...new Set(languages.map(l => l.group_name ?? "Andere"))];
  const allRegions = [...new Set(languages.map(l => {
    const r = l.region ?? "Andere";
    return r.split("/")[0].trim();
  }))];

  function toggleGroup(group: string) {
    setClosedGroups(prev => {
      const next = new Set(prev);
      next.has(group) ? next.delete(group) : next.add(group);
      return next;
    });
  }

  function toggleRegion(key: string) {
    setClosedRegions(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function renameGroup(oldName: string, newName: string) {
    if (!newName.trim() || newName === oldName) return;
    setLanguages(prev => prev.map(l =>
      l.group_name === oldName ? { ...l, group_name: newName } : l
    ));
  }

  function renameRegion(group: string, oldRegion: string, newRegion: string) {
    if (!newRegion.trim() || newRegion === oldRegion) return;
    setLanguages(prev => prev.map(l => {
      if (l.group_name !== group) return l;
      const parts = (l.region ?? "").split("/");
      if (parts[0].trim() === oldRegion) {
        const sub = parts[1] ? `/${parts[1]}` : "";
        return { ...l, region: newRegion + sub };
      }
      return l;
    }));
  }

  function renameSubRegion(group: string, region: string, oldSub: string, newSub: string) {
    if (!newSub.trim() || newSub === oldSub) return;
    setLanguages(prev => prev.map(l => {
      if (l.group_name !== group) return l;
      const parts = (l.region ?? "").split("/");
      if (parts[0].trim() === region && parts[1]?.trim() === oldSub) {
        return { ...l, region: `${region}/${newSub}` };
      }
      return l;
    }));
  }

  function handleLangDragStart(code: string) {
    dragItem.current = { type: "lang", code };
  }

  function handleGroupDragStart(group: string) {
    dragItem.current = { type: "group", group };
  }

  function handleRegionDragStart(group: string, region: string) {
    dragItem.current = { type: "region", group, region };
  }

  function handleDropOnLang(targetCode: string) {
    const item = dragItem.current;
    if (!item || item.type !== "lang") return;
    if (item.code === targetCode) return;
    setLanguages(prev => {
      const arr = [...prev];
      const fromIdx = arr.findIndex(l => l.code === item.code);
      const toIdx = arr.findIndex(l => l.code === targetCode);
      const target = arr[toIdx];
      arr[fromIdx] = { ...arr[fromIdx], group_name: target.group_name, region: target.region };
      const [moved] = arr.splice(fromIdx, 1);
      arr.splice(toIdx, 0, moved);
      return arr.map((l, i) => ({ ...l, sort_order: i + 1 }));
    });
    setDragOver(null);
    dragItem.current = null;
  }

  function handleDropOnRegion(targetGroup: string, targetRegion: string) {
    const item = dragItem.current;
    if (!item) return;
    if (item.type === "lang") {
      setLanguages(prev => prev.map(l =>
        l.code === item.code ? { ...l, group_name: targetGroup, region: targetRegion } : l
      ));
    } else if (item.type === "region" && (item.group !== targetGroup || item.region !== targetRegion)) {
      setLanguages(prev => {
        const sourceLangs = prev.filter(l => l.group_name === item.group && l.region?.split("/")[0].trim() === item.region);
        const others = prev.filter(l => !(l.group_name === item.group && l.region?.split("/")[0].trim() === item.region));
        const insertIdx = others.findIndex(l => l.group_name === targetGroup && l.region?.split("/")[0].trim() === targetRegion);
        if (insertIdx === -1) return prev;
        const updated = sourceLangs.map(l => ({ ...l, group_name: targetGroup, region: l.region?.replace(/^[^/]+/, targetRegion) ?? targetRegion }));
        others.splice(insertIdx, 0, ...updated);
        return others.map((l, i) => ({ ...l, sort_order: i + 1 }));
      });
    }
    setDragOver(null);
    dragItem.current = null;
  }

  function handleDropOnGroup(targetGroup: string) {
    const item = dragItem.current;
    if (!item) return;
    if (item.type === "lang") {
      setLanguages(prev => prev.map(l =>
        l.code === item.code ? { ...l, group_name: targetGroup } : l
      ));
    } else if (item.type === "group" && item.group !== targetGroup) {
      setLanguages(prev => {
        const sourceLangs = prev.filter(l => l.group_name === item.group);
        const others = prev.filter(l => l.group_name !== item.group);
        const insertIdx = others.findLastIndex(l => l.group_name === targetGroup) + 1;
        others.splice(insertIdx, 0, ...sourceLangs);
        return others.map((l, i) => ({ ...l, sort_order: i + 1 }));
      });
    }
    setDragOver(null);
    dragItem.current = null;
  }

  function updateEditingLang(patch: Partial<Language>) {
    if (!editingLang) return;
    const updated = { ...editingLang, ...patch };
    setEditingLang(updated);
    setLanguages(prev => prev.map(l => l.code === updated.code ? updated : l));
  }

  async function deleteLang(code: string) {
    if (!confirm(`Sprache wirklich löschen?`)) return;
    await supabase.from("languages").delete().eq("code", code);
    setLanguages(prev => prev.filter(l => l.code !== code));
    setEditingLang(null);
  }

  async function saveAll() {
    setSaving(true);
    for (const lang of languages) {
      await supabase.from("languages").update({
        label: lang.label,
        group_name: lang.group_name,
        region: lang.region,
        sort_order: lang.sort_order,
        active: lang.active,
      }).eq("code", lang.code);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  const LangRow = ({ lang }: { lang: Language }) => (
    <div
      key={lang.code}
      draggable
      onDragStart={() => handleLangDragStart(lang.code)}
      onDragOver={(e) => { e.preventDefault(); setDragOver(`lang:${lang.code}`); }}
      onDragLeave={() => setDragOver(null)}
      onDrop={() => handleDropOnLang(lang.code)}
      onClick={() => setEditingLang(lang)}
      className={["flex items-center gap-3 rounded-xl border px-3 py-2.5 cursor-pointer transition-colors",
        dragOver === `lang:${lang.code}` ? "border-white/30 bg-zinc-700" :
        editingLang?.code === lang.code ? "border-zinc-400 bg-zinc-900" :
        "border-zinc-800 hover:border-zinc-700"].join(" ")}
    >
      <DragHandle onDragStart={(e) => { e.stopPropagation(); handleLangDragStart(lang.code); }} />
      <span className="flex-1 text-sm text-white">{lang.label}</span>
      <span className="text-xs text-zinc-600 bg-zinc-900 px-2 py-0.5 rounded-md">{lang.code.toUpperCase()}</span>
      <span className={["text-xs px-2 py-0.5 rounded-full",
        lang.active ? "text-green-400 bg-green-400/10" : "text-zinc-600 bg-zinc-800"].join(" ")}>
        {lang.active ? "aktiv" : "inaktiv"}
      </span>
    </div>
  );

  return (
    <div className="text-white">
      <div className="mb-8">
        <div className="mb-2 text-xs uppercase tracking-[0.35em] text-zinc-400">Admin</div>
        <h1 className="text-5xl font-semibold tracking-tight">Menü konfiguriere</h1>
        <p className="mt-3 text-zinc-400">
          Gruppen und Regione erstelle, ein-/ausklappen, umbenennen und per Drag & Drop verschiebe.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-6">

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={saveAll}
              disabled={saving}
              className={["rounded-full px-8 py-3 text-base transition",
                saving ? "bg-zinc-300 text-black opacity-70 cursor-not-allowed" : "bg-white text-black hover:opacity-90"].join(" ")}
            >
              {saving ? "Speichere..." : "Speichern"}
            </button>
            {saved && <span className="text-green-400 text-sm">✓ gspeicheret</span>}
            <div className="flex gap-2 ml-auto flex-wrap">
              <button onClick={() => { setShowNewGroup(v => !v); setShowNewRegion(false); setShowNewSubRegion(false); }}
                className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:border-zinc-500 transition">
                + Gruppe
              </button>
              <button onClick={() => { setShowNewRegion(v => !v); setShowNewGroup(false); setShowNewSubRegion(false); }}
                className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:border-zinc-500 transition">
                + Region
              </button>
              <button onClick={() => { setShowNewSubRegion(v => !v); setShowNewGroup(false); setShowNewRegion(false); }}
                className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:border-zinc-500 transition">
                + Unterregion
              </button>
            </div>
          </div>

          {showNewGroup && (
            <div className="rounded-2xl border border-zinc-700 bg-zinc-900 p-4 flex gap-3 items-center">
              <input autoFocus value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="z. B. Asiatische Sprachen"
                className="flex-1 bg-black border border-zinc-800 rounded-xl px-4 py-2 text-sm text-white outline-none" />
              <button onClick={() => { setShowNewGroup(false); setNewGroupName(""); }}
                className="rounded-full bg-white text-black px-5 py-2 text-sm">OK</button>
              <button onClick={() => setShowNewGroup(false)} className="text-zinc-500 text-sm">✕</button>
            </div>
          )}

          {showNewRegion && (
            <div className="rounded-2xl border border-zinc-700 bg-zinc-900 p-4 flex gap-3 items-center flex-wrap">
              <select value={newRegionGroup} onChange={(e) => setNewRegionGroup(e.target.value)}
                className="bg-black border border-zinc-800 rounded-xl px-4 py-2 text-sm text-white outline-none">
                <option value="">Gruppe...</option>
                {allGroups.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <input value={newRegionName} onChange={(e) => setNewRegionName(e.target.value)}
                placeholder="z. B. Graubünden"
                className="flex-1 bg-black border border-zinc-800 rounded-xl px-4 py-2 text-sm text-white outline-none" />
              <button onClick={() => { setShowNewRegion(false); setNewRegionGroup(""); setNewRegionName(""); }}
                className="rounded-full bg-white text-black px-5 py-2 text-sm">OK</button>
              <button onClick={() => setShowNewRegion(false)} className="text-zinc-500 text-sm">✕</button>
            </div>
          )}

          {showNewSubRegion && (
            <div className="rounded-2xl border border-zinc-700 bg-zinc-900 p-4 flex gap-3 items-center flex-wrap">
              <select value={newSubRegionGroup} onChange={(e) => setNewSubRegionGroup(e.target.value)}
                className="bg-black border border-zinc-800 rounded-xl px-4 py-2 text-sm text-white outline-none">
                <option value="">Gruppe...</option>
                {allGroups.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <select value={newSubRegionParent} onChange={(e) => setNewSubRegionParent(e.target.value)}
                className="bg-black border border-zinc-800 rounded-xl px-4 py-2 text-sm text-white outline-none">
                <option value="">Region...</option>
                {allRegions.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <input value={newSubRegionName} onChange={(e) => setNewSubRegionName(e.target.value)}
                placeholder="z. B. Bern"
                className="flex-1 bg-black border border-zinc-800 rounded-xl px-4 py-2 text-sm text-white outline-none" />
              <button onClick={() => { setShowNewSubRegion(false); setNewSubRegionGroup(""); setNewSubRegionParent(""); setNewSubRegionName(""); }}
                className="rounded-full bg-white text-black px-5 py-2 text-sm">OK</button>
              <button onClick={() => setShowNewSubRegion(false)} className="text-zinc-500 text-sm">✕</button>
            </div>
          )}

          {loading ? <div className="text-zinc-500">Lade...</div> : (
            <div className="space-y-4">
              {tree.map(groupNode => {
                const groupOpen = !closedGroups.has(groupNode.group);
                return (
                  <div
                    key={groupNode.group}
                    className={["rounded-[2rem] border bg-zinc-950 transition-colors",
                      dragOver === `group:${groupNode.group}` ? "border-white/30 bg-zinc-900" : "border-zinc-800"].join(" ")}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(`group:${groupNode.group}`); }}
                    onDragLeave={() => setDragOver(null)}
                    onDrop={() => handleDropOnGroup(groupNode.group)}
                  >
                    <div
                      className="flex items-center gap-2 p-5 cursor-pointer select-none"
                      onClick={() => toggleGroup(groupNode.group)}
                    >
                      <DragHandle onDragStart={(e) => { e.stopPropagation(); handleGroupDragStart(groupNode.group); }} />
                      <Chevron open={groupOpen} />
                      <span className="text-xs uppercase tracking-[0.3em] flex-1">
                        <InlineEdit value={groupNode.group} onSave={(val) => renameGroup(groupNode.group, val)} className="text-zinc-400" />
                      </span>
                      <span className="text-xs text-zinc-700">
                        {groupNode.regions.reduce((acc, r) => acc + r.languages.length + r.subRegions.reduce((a, s) => a + s.languages.length, 0), 0)} Sprachen
                      </span>
                    </div>

                    {groupOpen && (
                      <div className="px-5 pb-5 space-y-3">
                        {groupNode.regions.map(regionNode => {
                          const regionKey = `${groupNode.group}:${regionNode.region}`;
                          const regionOpen = !closedRegions.has(regionKey);
                          return (
                            <div
                              key={regionNode.region}
                              className={["rounded-2xl border transition-colors",
                                dragOver === `region:${regionKey}` ? "border-zinc-500 bg-zinc-800" : "border-zinc-800 bg-black"].join(" ")}
                              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(`region:${regionKey}`); }}
                              onDragLeave={() => setDragOver(null)}
                              onDrop={(e) => { e.stopPropagation(); handleDropOnRegion(groupNode.group, regionNode.region); }}
                            >
                              <div
                                className="flex items-center gap-2 px-4 py-3 cursor-pointer select-none"
                                onClick={() => toggleRegion(regionKey)}
                              >
                                <DragHandle onDragStart={(e) => { e.stopPropagation(); handleRegionDragStart(groupNode.group, regionNode.region); }} />
                                <Chevron open={regionOpen} />
                                <span className="text-sm flex-1">
                                  <InlineEdit value={regionNode.region} onSave={(val) => renameRegion(groupNode.group, regionNode.region, val)} className="text-zinc-400" />
                                </span>
                                <span className="text-xs text-zinc-700">
                                  {regionNode.languages.length + regionNode.subRegions.reduce((a, s) => a + s.languages.length, 0)}
                                </span>
                              </div>

                              {regionOpen && (
                                <div className="px-4 pb-3 space-y-3">
                                  {regionNode.languages.map(lang => <LangRow key={lang.code} lang={lang} />)}

                                  {regionNode.subRegions.map(subNode => {
                                    const subKey = `${regionKey}:${subNode.subRegion}`;
                                    const subOpen = !closedRegions.has(subKey);
                                    return (
                                      <div key={subNode.subRegion} className="rounded-xl border border-zinc-800 bg-zinc-950">
                                        <div
                                          className="flex items-center gap-2 px-3 py-2.5 cursor-pointer select-none"
                                          onClick={() => toggleRegion(subKey)}
                                        >
                                          <Chevron open={subOpen} />
                                          <span className="text-xs flex-1 text-zinc-500">
                                            <InlineEdit
                                              value={subNode.subRegion}
                                              onSave={(val) => renameSubRegion(groupNode.group, regionNode.region, subNode.subRegion, val)}
                                              className="text-zinc-500"
                                            />
                                          </span>
                                          <span className="text-xs text-zinc-700">{subNode.languages.length}</span>
                                        </div>
                                        {subOpen && (
                                          <div className="px-3 pb-3 space-y-2">
                                            {subNode.languages.map(lang => <LangRow key={lang.code} lang={lang} />)}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Rechts: Eigenschaften */}
        <div className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-6 h-fit sticky top-6">
          {editingLang ? (
            <>
              <h2 className="text-2xl font-semibold mb-6">{editingLang.label}</h2>
              <div className="space-y-4">
                <label className="block">
                  <div className="mb-2 text-zinc-400 text-sm">Label</div>
                  <input value={editingLang.label} onChange={(e) => updateEditingLang({ label: e.target.value })}
                    className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none text-sm" />
                </label>
                <label className="block">
                  <div className="mb-2 text-zinc-400 text-sm">Gruppe</div>
                  <input value={editingLang.group_name ?? ""} onChange={(e) => updateEditingLang({ group_name: e.target.value })}
                    list="g-opts" placeholder="Schweizer Sprachen"
                    className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none text-sm" />
                  <datalist id="g-opts">{allGroups.map(g => <option key={g} value={g} />)}</datalist>
                </label>
                <label className="block">
                  <div className="mb-2 text-zinc-400 text-sm">Region (oder Region/Unterregion)</div>
                  <input value={editingLang.region ?? ""} onChange={(e) => updateEditingLang({ region: e.target.value })}
                    list="r-opts" placeholder="Landessprachen/Rätoromanisch"
                    className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none text-sm" />
                  <datalist id="r-opts">
                    {[...new Set(languages.map(l => l.region ?? ""))].filter(Boolean).map(r => <option key={r} value={r} />)}
                  </datalist>
                  <div className="mt-2 text-xs text-zinc-600">Unterregion: z. B. <span className="text-zinc-400">Landessprachen/Rätoromanisch</span></div>
                </label>
                <label className="flex items-center gap-3">
                  <input type="checkbox" checked={editingLang.active} onChange={(e) => updateEditingLang({ active: e.target.checked })} />
                  <span className="text-zinc-300 text-sm">Aktiv im Menü</span>
                </label>
              </div>
              <div className="mt-6 rounded-2xl border border-zinc-800 p-4">
                <div className="text-xs uppercase tracking-[0.25em] text-zinc-500 mb-2">Menüpfad</div>
                <div className="text-xs text-zinc-500">{editingLang.group_name ?? "—"}</div>
                <div className="text-xs text-zinc-600">→ {editingLang.region ?? "—"}</div>
                <div className="mt-2 text-base font-medium">{editingLang.label}</div>
                <div className="text-xs text-zinc-600 mt-0.5">{editingLang.code.toUpperCase()}</div>
              </div>
              <button
                onClick={() => deleteLang(editingLang.code)}
                className="mt-4 w-full rounded-2xl border border-red-900 text-red-500 hover:bg-red-950 px-4 py-3 text-sm transition"
              >
                🗑 Löschen
              </button>
            </>
          ) : (
            <div className="space-y-3 text-sm text-zinc-500">
              <div className="text-zinc-400 font-medium">Anleitung</div>
              <p>▶ Gruppe oder Region anklicken zum Ein-/Ausklappen.</p>
              <p>✎ Name anklicken zum Umbenennen.</p>
              <p>⠿ Drag Handle zum Verschieben.</p>
              <p>Sprache anklicken → Eigenschaften bearbeiten.</p>
              <p className="text-zinc-600 text-xs">Unterregion via Feld: <span className="text-zinc-400">Landessprachen/Rätoromanisch</span></p>
              <div className="pt-3 border-t border-zinc-800 text-zinc-600 text-xs">
                {languages.length} Sprachen · {tree.length} Gruppen
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}