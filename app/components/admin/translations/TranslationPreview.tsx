"use client";

export default function TranslationPreview({
  value,
  label,
  language,
}: {
  value: string;
  label: string;
  language: string;
}) {
  return (
    <div className="mt-10 rounded-[1.75rem] border border-zinc-800 p-6">
      <div className="text-xs tracking-[0.35em] uppercase text-zinc-500 mb-4">
        Vorschau
      </div>

      <div className="text-6xl font-semibold">
        {value || "—"}
      </div>

      <div className="text-zinc-400 mt-4 text-xl">
        {label}
      </div>

      <div className="text-zinc-500 mt-2">
        Sprache: {language}
      </div>
    </div>
  );
}