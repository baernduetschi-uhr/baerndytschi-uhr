"use client";

import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type ImportLanguage = {
  code: string;
  label?: string;
  active?: boolean;
  is_default?: boolean;
};

type ImportTranslation = {
  category: string;
  key: string;
  value: string;
};

type ImportTimeWord = {
  key: string;
  value: string;
};

type ImportPayload = {
  language?: ImportLanguage;
  translations?: unknown;
  time_words?: unknown;
};

export default function LanguageImportPage() {
  const [jsonText, setJsonText] = useState("");
  const [status, setStatus] = useState("");
  const [details, setDetails] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const parsedPreview = useMemo(() => {
    try {
      return JSON.parse(jsonText) as ImportPayload;
    } catch {
      return null;
    }
  }, [jsonText]);

  function validatePayload(payload: ImportPayload) {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!payload.language) {
      errors.push("Objekt 'language' fehlt.");
    }

    if (!payload.language?.code || typeof payload.language.code !== "string") {
      errors.push("language.code fehlt oder ist ungültig.");
    }

    if (
      payload.translations !== undefined &&
      !Array.isArray(payload.translations)
    ) {
      errors.push("'translations' muss ein Array sein.");
    }

    if (
      payload.time_words !== undefined &&
      !Array.isArray(payload.time_words)
    ) {
      errors.push("'time_words' muss ein Array sein.");
    }

    const translationsArray: unknown[] = Array.isArray(payload.translations)
      ? payload.translations
      : [];

    const timeWordsArray: unknown[] = Array.isArray(payload.time_words)
      ? payload.time_words
      : [];

    const validTranslations: ImportTranslation[] = translationsArray.filter(
      (item, index) => {
        const row = item as Partial<ImportTranslation>;

        const ok =
          row &&
          typeof row.category === "string" &&
          typeof row.key === "string" &&
          typeof row.value === "string";

        if (!ok) {
          warnings.push(
            `Ungültiger translations-Eintrag in Zeile ${index + 1} ignoriert.`
          );
        }

        return ok;
      }
    ) as ImportTranslation[];

    const validTimeWords: ImportTimeWord[] = timeWordsArray.filter(
      (item, index) => {
        const row = item as Partial<ImportTimeWord>;

        const ok =
          row &&
          typeof row.key === "string" &&
          typeof row.value === "string";

        if (!ok) {
          warnings.push(
            `Ungültiger time_words-Eintrag in Zeile ${index + 1} ignoriert.`
          );
        }

        return ok;
      }
    ) as ImportTimeWord[];

    return {
      errors,
      warnings,
      validTranslations,
      validTimeWords,
    };
  }

  function dedupeTranslations(rows: ImportTranslation[]) {
    const map = new Map<string, ImportTranslation>();

    for (const row of rows) {
      const compositeKey = `${row.category}__${row.key}`;
      map.set(compositeKey, row);
    }

    return Array.from(map.values());
  }

  function dedupeTimeWords(rows: ImportTimeWord[]) {
    const map = new Map<string, ImportTimeWord>();

    for (const row of rows) {
      map.set(row.key, row);
    }

    return Array.from(map.values());
  }

  async function handleImport() {
    setLoading(true);
    setStatus("");
    setDetails([]);

    let parsed: ImportPayload;

    try {
      parsed = JSON.parse(jsonText);
    } catch {
      setLoading(false);
      setStatus("❌ JSON ist ungültig.");
      return;
    }

    const { errors, warnings, validTranslations, validTimeWords } =
      validatePayload(parsed);

    if (errors.length > 0) {
      setLoading(false);
      setStatus("❌ Import abgebrochen.");
      setDetails(errors);
      return;
    }

    const language = parsed.language!;

    const dedupedTranslations = dedupeTranslations(validTranslations);
    const dedupedTimeWords = dedupeTimeWords(validTimeWords);

    try {
      const { error: languageError } = await supabase.from("languages").upsert(
        {
          code: language.code,
          label: language.label ?? language.code,
          active: language.active ?? true,
          is_default: language.is_default ?? false,
        },
        {
          onConflict: "code",
        }
      );

      if (languageError) {
        throw languageError;
      }

      if (dedupedTranslations.length > 0) {
        const rows = dedupedTranslations.map((item) => ({
          category: item.category,
          key: item.key,
          value: item.value,
          language: language.code,
        }));

        const { error } = await supabase.from("translations").upsert(rows, {
          onConflict: "language,category,key",
        });

        if (error) {
          throw error;
        }
      }

      if (dedupedTimeWords.length > 0) {
        const rows = dedupedTimeWords.map((item) => ({
          key: item.key,
          value: item.value,
          language: language.code,
        }));

        const { error } = await supabase.from("time_words").upsert(rows, {
          onConflict: "language,key",
        });

        if (error) {
          throw error;
        }
      }

      setStatus("✅ Import erfolgreich.");
      setDetails([
        `Sprache: ${language.code}`,
        `Übersetzungen: ${dedupedTranslations.length}`,
        `Zeitwörter: ${dedupedTimeWords.length}`,
        ...warnings,
      ]);
    } catch (err) {
      console.error(err);
      setStatus("❌ Fehler beim Import.");
      setDetails([
        "Bitte Konsole prüfen oder die Supabase-Tabellen kontrollieren.",
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-5xl text-white">
      <div className="mb-8">
        <div className="mb-2 text-xs uppercase tracking-[0.35em] text-zinc-400">
          Admin
        </div>
        <h1 className="text-5xl font-semibold">Sprache importieren</h1>
        <p className="mt-3 text-zinc-400">
          JSON einfügen und eine komplette Sprache laden.
        </p>
      </div>

      <div className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-6">
        <textarea
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          placeholder="JSON hier einfügen..."
          className="h-[320px] w-full rounded-xl border border-zinc-800 bg-black p-4 font-mono text-sm outline-none"
        />

        <div className="mt-6 flex flex-wrap gap-4">
          <button
            onClick={handleImport}
            disabled={loading}
            className={[
              "rounded-full px-6 py-3 transition",
              loading
                ? "cursor-not-allowed bg-zinc-300 text-black opacity-70"
                : "bg-white text-black",
            ].join(" ")}
          >
            {loading ? "Import läuft..." : "Importieren"}
          </button>
        </div>

        {parsedPreview && parsedPreview.language && (
          <div className="mt-6 rounded-2xl border border-zinc-800 p-4">
            <div className="mb-2 text-sm text-zinc-400">Vorschau</div>
            <div className="text-lg">
              Sprache: {parsedPreview.language.label ?? parsedPreview.language.code}
            </div>
            <div className="mt-1 text-zinc-400">
              Code: {parsedPreview.language.code}
            </div>
            <div className="mt-1 text-zinc-400">
              Übersetzungen:{" "}
              {Array.isArray(parsedPreview.translations)
                ? parsedPreview.translations.length
                : 0}
            </div>
            <div className="mt-1 text-zinc-400">
              Zeitwörter:{" "}
              {Array.isArray(parsedPreview.time_words)
                ? parsedPreview.time_words.length
                : 0}
            </div>
          </div>
        )}

        {status && <div className="mt-6 text-sm">{status}</div>}

        {details.length > 0 && (
          <div className="mt-3 space-y-2 rounded-2xl border border-zinc-800 p-4 text-sm text-zinc-300">
            {details.map((item, index) => (
              <div key={index}>{item}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
