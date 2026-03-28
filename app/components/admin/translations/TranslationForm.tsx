"use client";

type TranslationItem = {
  id: string;
  key: string;
  value: string;
  category: string;
  language: string;
};

export default function TranslationForm({
  draft,
  setDraft,
  onSave,
  onDelete,
  categoryLabel,
  saving = false,
}: {
  draft: TranslationItem;
  setDraft: (item: TranslationItem) => void;
  onSave: () => void;
  onDelete: () => void;
  categoryLabel: string;
  saving?: boolean;
}) {
  return (
    <>
      <h2 className="text-4xl font-semibold mb-8">Bearbeite Begriff</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <label className="block">
          <div className="text-zinc-400 mb-2">Kategorie</div>
          <input
            value={categoryLabel}
            disabled
            className="w-full rounded-2xl border border-zinc-800 bg-black px-5 py-4 text-white outline-none opacity-80"
          />
        </label>

        <label className="block">
          <div className="text-zinc-400 mb-2">Schlüssel</div>
          <input
            value={draft.key}
            onChange={(e) =>
              setDraft({
                ...draft,
                key: e.target.value,
              })
            }
            className="w-full rounded-2xl border border-zinc-800 bg-black px-5 py-4 text-white outline-none"
          />
        </label>

        <label className="block md:col-span-2">
          <div className="text-zinc-400 mb-2">Aazeigetext</div>
          <input
            value={draft.value}
            onChange={(e) =>
              setDraft({
                ...draft,
                value: e.target.value,
              })
            }
            className="w-full rounded-2xl border border-zinc-800 bg-black px-5 py-4 text-white outline-none"
            placeholder="z. B. Mäntig"
          />
        </label>
      </div>

      <div className="flex gap-4 mt-8">
        <button
          onClick={onSave}
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

        <button
          onClick={onDelete}
          disabled={saving}
          className={[
            "rounded-full border px-8 py-4 text-xl transition",
            saving
              ? "border-zinc-800 text-zinc-600 cursor-not-allowed"
              : "border-zinc-700 text-white hover:border-zinc-500",
          ].join(" ")}
        >
          Löschen
        </button>
      </div>
    </>
  );
}