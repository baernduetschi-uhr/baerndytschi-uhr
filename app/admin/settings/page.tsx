"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type SettingItem = {
  key: string;
  value: string;
};

type LanguageOption = {
  code: string;
  label: string;
};

const labels: Record<string, string> = {
  active_language: "Aktive Sprache",
  show_digital_time: "Digitale Zeit anzeigen",
  holiday_overrides_time: "Feiertag überschreibt Zeit",
  show_date: "Datum anzeigen",
};

const descriptions: Record<string, string> = {
  active_language: "Legt fest, in welcher Sprache die Uhr angezeigt wird.",
  show_digital_time: "Zeigt die kleine digitale Uhr unter dem Haupttext.",
  holiday_overrides_time:
    "Wenn aktiv, wird an Feiertagen statt der Zeit der Feiertag angezeigt.",
  show_date: "Zeigt das Datum unter dem Haupttext an.",
};

const sortOrder = [
  "active_language",
  "show_digital_time",
  "holiday_overrides_time",
  "show_date",
];

function isBooleanSetting(key: string) {
  return (
    key === "show_digital_time" ||
    key === "holiday_overrides_time" ||
    key === "show_date"
  );
}

function prettyValue(
  key: string,
  value: string,
  languages: LanguageOption[]
) {
  if (isBooleanSetting(key)) {
    return value === "true" ? "Ein" : "Aus";
  }

  if (key === "active_language") {
    return languages.find((l) => l.code === value)?.label ?? value;
  }

  return value;
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={[
        "relative inline-flex h-8 w-16 items-center rounded-full transition",
        checked ? "bg-white" : "bg-zinc-800",
      ].join(" ")}
      aria-pressed={checked}
    >
      <span
        className={[
          "inline-block h-6 w-6 transform rounded-full transition",
          checked ? "translate-x-9 bg-black" : "translate-x-1 bg-white",
        ].join(" ")}
      />
    </button>
  );
}

export default function SettingsPage() {
  const [items, setItems] = useState<SettingItem[]>([]);
  const [languages, setLanguages] = useState<LanguageOption[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function loadAll() {
      setLoading(true);

      const [settingsResult, languagesResult] = await Promise.all([
        supabase.from("app_settings").select("key, value"),
        supabase
          .from("languages")
          .select("code, label")
          .eq("active", true)
          .order("label", { ascending: true }),
      ]);

      if (settingsResult.error) {
        console.error("Fehler beim Laden der Einstellungen:", settingsResult.error);
      }

      if (languagesResult.error) {
        console.error("Fehler beim Laden der Sprachen:", languagesResult.error);
      }

      const rows = ((settingsResult.data ?? []) as SettingItem[]).sort(
        (a, b) => sortOrder.indexOf(a.key) - sortOrder.indexOf(b.key)
      );

      setItems(rows);
      setLanguages((languagesResult.data ?? []) as LanguageOption[]);
      setSelectedKey(rows[0]?.key ?? null);
      setLoading(false);
    }

    loadAll();
  }, []);

  const draft = items.find((item) => item.key === selectedKey) ?? null;

  function setDraft(updated: SettingItem) {
    setItems((prev) => prev.map((i) => (i.key === updated.key ? updated : i)));
  }

  async function saveItem() {
    if (!draft) return;

    setSaving(true);

    const { error } = await supabase
      .from("app_settings")
      .update({ value: draft.value })
      .eq("key", draft.key);

    setSaving(false);

    if (error) {
      console.error("Fehler beim Speichern:", error);
      return;
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div className="text-white">
      <div className="mb-8">
        <div className="text-xs tracking-[0.35em] uppercase text-zinc-400 mb-2">
          Admin
        </div>
        <h1 className="text-5xl font-semibold tracking-tight">
          Einstellungen
        </h1>
        <p className="text-zinc-400 mt-3">
          Hier steuerst du das Verhalten der Uhr.
        </p>
      </div>

      {loading ? (
        <div className="text-zinc-500">Lade...</div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[360px_minmax(0,1fr)] gap-6">
          <section className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-5">
            <div className="mb-5">
              <h2 className="text-3xl font-semibold">Einstellungen</h2>
            </div>

            <div className="space-y-4">
              {items.map((item) => {
                const active = item.key === selectedKey;

                return (
                  <button
                    key={item.key}
                    onClick={() => setSelectedKey(item.key)}
                    className={[
                      "w-full rounded-[1.5rem] border px-5 py-4 text-left transition",
                      active
                        ? "bg-zinc-100 text-black border-zinc-100"
                        : "bg-transparent text-white border-zinc-800 hover:border-zinc-600",
                    ].join(" ")}
                  >
                    <div className="text-2xl font-medium">
                      {labels[item.key] ?? item.key}
                    </div>
                    <div
                      className={
                        active ? "text-zinc-600 mt-1" : "text-zinc-400 mt-1"
                      }
                    >
                      {prettyValue(item.key, item.value, languages)}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-8">
            {draft ? (
              <>
                <h2 className="text-4xl font-semibold mb-8">
                  Einstellung bearbeiten
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <label className="block">
                    <div className="text-zinc-400 mb-2">Schlüssel</div>
                    <input
                      value={draft.key}
                      disabled
                      className="w-full rounded-2xl border border-zinc-800 bg-black px-5 py-4 text-white opacity-80"
                    />
                  </label>

                  <div className="block">
                    <div className="text-zinc-400 mb-2">Wert</div>

                    {draft.key === "active_language" ? (
                      // Dynamisches Dropdown aus DB
                      <select
                        value={draft.value}
                        onChange={(e) =>
                          setDraft({ ...draft, value: e.target.value })
                        }
                        className="w-full rounded-2xl border border-zinc-800 bg-black px-5 py-4 text-white outline-none"
                      >
                        {languages.map((lang) => (
                          <option key={lang.code} value={lang.code}>
                            {lang.label} ({lang.code})
                          </option>
                        ))}
                      </select>
                    ) : isBooleanSetting(draft.key) ? (
                      <div className="flex items-center gap-4 rounded-2xl border border-zinc-800 bg-black px-5 py-4 min-h-[58px]">
                        <Toggle
                          checked={draft.value === "true"}
                          onChange={(next) =>
                            setDraft({
                              ...draft,
                              value: next ? "true" : "false",
                            })
                          }
                        />
                        <span className="text-white">
                          {draft.value === "true" ? "Ein" : "Aus"}
                        </span>
                      </div>
                    ) : (
                      <input
                        value={draft.value}
                        onChange={(e) =>
                          setDraft({ ...draft, value: e.target.value })
                        }
                        className="w-full rounded-2xl border border-zinc-800 bg-black px-5 py-4 text-white outline-none"
                      />
                    )}
                  </div>

                  <div className="md:col-span-2 rounded-[1.5rem] border border-zinc-800 p-5">
                    <div className="text-zinc-400 text-sm mb-2">Beschreibung</div>
                    <div className="text-lg text-zinc-200">
                      {descriptions[draft.key] ?? "Keine Beschreibung vorhanden."}
                    </div>
                  </div>
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

                <div className="mt-4">
                  {saved && <div className="text-green-400">✓ gespeichert</div>}
                </div>

                <div className="mt-10 rounded-[1.75rem] border border-zinc-800 p-6">
                  <div className="text-xs tracking-[0.35em] uppercase text-zinc-500 mb-4">
                    Vorschau
                  </div>
                  <div className="text-4xl font-semibold">
                    {labels[draft.key] ?? draft.key}
                  </div>
                  <div className="text-zinc-400 mt-4 text-xl">
                    {prettyValue(draft.key, draft.value, languages)}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-zinc-500">
                Wähle links eine Einstellung aus.
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
