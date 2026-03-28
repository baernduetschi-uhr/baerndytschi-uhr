"use client";

type TranslationItem = {
  id: string;
  key: string;
  value: string;
};

export default function TranslationList({
  items,
  selectedId,
  onSelect,
  onCreate,
  prettyKey,
}: {
  items: TranslationItem[];
  selectedId: string | null;
  onSelect: (item: TranslationItem) => void;
  onCreate: () => void;
  prettyKey: (key: string) => string;
}) {
  return (
    <section className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-5">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-3xl font-semibold">Einträge</h2>

        <button
          onClick={onCreate}
          className="rounded-full bg-white text-black px-5 py-3"
        >
          Neu
        </button>
      </div>

      <div className="space-y-4">
        {items.map((item) => {
          const active = item.id === selectedId;

          return (
            <button
              key={item.id}
              onClick={() => onSelect(item)}
              className={[
                "w-full rounded-[1.5rem] border px-5 py-4 text-left transition",
                active
                  ? "bg-zinc-100 text-black border-zinc-100"
                  : "bg-transparent text-white border-zinc-800 hover:border-zinc-600",
              ].join(" ")}
            >
              <div className="text-2xl font-medium">
                {prettyKey(item.key)}
              </div>

              <div
                className={
                  active ? "text-zinc-600 mt-1" : "text-zinc-400 mt-1"
                }
              >
                {item.value || "—"}
              </div>
            </button>
          );
        })}

        {items.length === 0 && (
          <div className="text-zinc-500">
            No kei Iiträg i dere Kategorie.
          </div>
        )}
      </div>
    </section>
  );
}