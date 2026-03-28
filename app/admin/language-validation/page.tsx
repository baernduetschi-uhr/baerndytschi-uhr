"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type LanguageItem = {
  code: string;
  label: string;
  active: boolean;
};

type TranslationRow = {
  category: string;
  key: string;
  value: string;
  language: string;
};

type TimeWordRow = {
  key: string;
  value: string;
  language: string;
};

const requiredWeekdays = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const requiredMonths = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

const requiredDays = Array.from({ length: 31 }, (_, i) => String(i + 1));

const requiredTimeWords = [
  "exact",
  "plus_5",
  "plus_10",
  "quarter_past",
  "twenty_past",
  "five_before_half",
  "half",
  "five_after_half",
  "twenty_to",
  "quarter_to",
  "ten_to",
  "five_to",
];

const requiredHourWords = Array.from({ length: 24 }, (_, i) => `hour_${i}`);

function difference(required: string[], existing: string[]) {
  const existingSet = new Set(existing);
  return required.filter((item) => !existingSet.has(item));
}

function StatusBadge({ ok }: { ok: boolean }) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-3 py-1 text-xs uppercase tracking-[0.24em]",
        ok
          ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
          : "bg-amber-500/10 text-amber-300 border border-amber-500/20",
      ].join(" ")}
    >
      {ok ? "vollständig" : "unvollständig"}
    </span>
  );
}

export default function LanguageValidationPage() {
  const [languages, setLanguages] = useState<LanguageItem[]>([]);
  const [translations, setTranslations] = useState<TranslationRow[]>([]);
  const [timeWords, setTimeWords] = useState<TimeWordRow[]>([]);
  const [selectedCode, setSelectedCode] = useState("");
  const [loadingLanguages, setLoadingLanguages] = useState(true);
  const [loadingData, setLoadingData] = useState(false);

  // Einmalig: nur Sprachliste laden
  useEffect(() => {
    async function loadLanguages() {
      setLoadingLanguages(true);

      const { data, error } = await supabase
        .from("languages")
        .select("code, label, active")
        .order("label", { ascending: true });

      if (error) {
        console.error("Fehler bim Lade vo de Sprache:", error);
        setLoadingLanguages(false);
        return;
      }

      const langRows = (data ?? []) as LanguageItem[];
      setLanguages(langRows);
      setSelectedCode(langRows[0]?.code ?? "");
      setLoadingLanguages(false);
    }

    loadLanguages();
  }, []);

  // Bei Sprachwechsel: nur Daten für gewählte Sprache laden
  useEffect(() => {
    if (!selectedCode) return;

    async function loadForLanguage() {
      setLoadingData(true);
      setTranslations([]);
      setTimeWords([]);

      const { data: translationData, error: translationError } = await supabase
        .from("translations")
        .select("category, key, value, language")
        .eq("language", selectedCode);

      if (translationError) {
        console.error("Fehler bim Lade vo de Übersetzige:", translationError);
        setLoadingData(false);
        return;
      }

      const { data: timeWordData, error: timeWordError } = await supabase
        .from("time_words")
        .select("key, value, language")
        .eq("language", selectedCode);

      if (timeWordError) {
        console.error("Fehler bim Lade vo de Zytwörter:", timeWordError);
        setLoadingData(false);
        return;
      }

      setTranslations((translationData ?? []) as TranslationRow[]);
      setTimeWords((timeWordData ?? []) as TimeWordRow[]);
      setLoadingData(false);
    }

    loadForLanguage();
  }, [selectedCode]);

  const validation = useMemo(() => {
    if (!selectedCode) return null;

    const weekdayKeys = translations
      .filter((item) => item.category === "weekday")
      .map((item) => item.key);

    const monthKeys = translations
      .filter((item) => item.category === "month")
      .map((item) => item.key);

    const dayKeys = translations
      .filter((item) => item.category === "day")
      .map((item) => item.key);

    const timeWordKeys = timeWords.map((item) => item.key);

    const missingWeekdays = difference(requiredWeekdays, weekdayKeys);
    const missingMonths = difference(requiredMonths, monthKeys);
    const missingDays = difference(requiredDays, dayKeys);
    const missingTimeWords = difference(requiredTimeWords, timeWordKeys);
    const missingHourWords = difference(requiredHourWords, timeWordKeys);

    const checks = [
      {
        title: "Wochentäg",
        required: requiredWeekdays.length,
        existing: requiredWeekdays.length - missingWeekdays.length,
        missing: missingWeekdays,
      },
      {
        title: "Monet",
        required: requiredMonths.length,
        existing: requiredMonths.length - missingMonths.length,
        missing: missingMonths,
      },
      {
        title: "Tageszahle",
        required: requiredDays.length,
        existing: requiredDays.length - missingDays.length,
        missing: missingDays,
      },
      {
        title: "Zytwörter",
        required: requiredTimeWords.length,
        existing: requiredTimeWords.length - missingTimeWords.length,
        missing: missingTimeWords,
      },
      {
        title: "Stundewörter",
        required: requiredHourWords.length,
        existing: requiredHourWords.length - missingHourWords.length,
        missing: missingHourWords,
      },
    ];

    const totalMissing = checks.reduce(
      (sum, item) => sum + item.missing.length,
      0
    );

    return {
      checks,
      totalMissing,
      complete: totalMissing === 0,
    };
  }, [selectedCode, translations, timeWords]);

  return (
    <div className="text-white max-w-6xl">
      <div className="mb-8">
        <div className="text-xs tracking-[0.35em] uppercase text-zinc-400 mb-2">
          Admin
        </div>
        <h1 className="text-5xl font-semibold">Sprach-Prüefig</h1>
        <p className="text-zinc-400 mt-3">
          Prüeft, ob e Sprach vollständig isch.
        </p>
      </div>

      {loadingLanguages ? (
        <div className="text-zinc-500">Lade...</div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)] gap-6">
          <section className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-5">
            <div className="mb-5">
              <h2 className="text-3xl font-semibold">Sprache</h2>
            </div>

            <div className="space-y-4">
              {languages.map((lang) => {
                const active = lang.code === selectedCode;

                return (
                  <button
                    key={lang.code}
                    onClick={() => setSelectedCode(lang.code)}
                    className={[
                      "w-full rounded-[1.5rem] border px-5 py-4 text-left transition",
                      active
                        ? "bg-zinc-100 text-black border-zinc-100"
                        : "bg-transparent text-white border-zinc-800 hover:border-zinc-600",
                    ].join(" ")}
                  >
                    <div className="text-2xl font-medium">{lang.label}</div>
                    <div
                      className={
                        active ? "text-zinc-600 mt-1" : "text-zinc-400 mt-1"
                      }
                    >
                      {lang.code}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-8">
            {loadingData ? (
              <div className="text-zinc-500">Lade Sprach-Daten...</div>
            ) : validation ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                  <div>
                    <h2 className="text-4xl font-semibold">
                      Prüefig für {selectedCode}
                    </h2>
                    <p className="text-zinc-400 mt-2">
                      Vollständigkeit vo Übersetzige und Zytwörter
                    </p>
                  </div>

                  <StatusBadge ok={validation.complete} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {validation.checks.map((check) => {
                    const ok = check.missing.length === 0;

                    return (
                      <div
                        key={check.title}
                        className="rounded-[1.5rem] border border-zinc-800 p-5"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="text-2xl font-medium">{check.title}</div>
                          <StatusBadge ok={ok} />
                        </div>

                        <div className="mt-3 text-zinc-400">
                          {check.existing} / {check.required} vorhanden
                        </div>

                        {check.missing.length > 0 ? (
                          <div className="mt-4">
                            <div className="text-sm text-amber-300 mb-2">
                              Fählt:
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {check.missing.map((item) => (
                                <span
                                  key={item}
                                  className="rounded-full border border-zinc-700 px-3 py-1 text-sm text-zinc-300"
                                >
                                  {item}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="mt-4 text-emerald-300 text-sm">
                            Alles da.
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-8 rounded-[1.5rem] border border-zinc-800 p-5">
                  <div className="text-zinc-400 text-sm mb-2">Gesamtstatus</div>
                  <div className="text-2xl font-medium">
                    {validation.complete
                      ? "Die Sprach isch vollständig."
                      : `${validation.totalMissing} Iiträg fähle no.`}
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
