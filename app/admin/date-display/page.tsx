"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { supabase } from "@/lib/supabase";
import { ClockDisplay } from "@/src/components/clock/ClockDisplay";
import type {
  ClockDisplayState,
  DatePart,
} from "@/src/domain/clock/types";
import { formatLocalizedDateParts } from "@/src/lib/formatLocalizedDateParts";
import { formatBerneseTime } from "@/src/lib/formatBerneseTime";

type LanguageItem = {
  code: string;
  label: string;
  active: boolean;
};

type DateDisplayPart = {
  id: string;
  language: string;
  position: number;
  part_type: "weekday" | "article" | "day" | "month" | "year" | "connector";
  label: string;
  value: string | null;
  is_enabled: boolean;
};

const previewNow = new Date("2026-03-23T17:55:00");

const previewFallbackState: ClockDisplayState = {
  holidayText: "",
  holidayColor: "gold",
  birthdays: [],
  mealText: "",
  mealColor: "white",
  timeText: "...",
  dateText: "",
  digitalText: "17:55",
  digitalDateText: "23.3.2026",
  theme: "default",
  holiday: null,
  meal: null,
};

// ─── Sortable Row ────────────────────────────────────────────────────────────

type SortableRowProps = {
  item: DateDisplayPart;
  baseDateParts: DatePart[];
  onUpdate: (id: string, patch: Partial<DateDisplayPart>) => void;
};

function SortableRow({ item, baseDateParts, onUpdate }: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  const placeholder =
    baseDateParts.find((p) => p.type === item.part_type)?.value ??
    `[${item.part_type}]`;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="grid grid-cols-1 gap-4 rounded-[1.5rem] border border-zinc-800 p-5 md:grid-cols-[40px_180px_minmax(0,1fr)_120px]"
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="flex items-center justify-center cursor-grab active:cursor-grabbing text-zinc-600 hover:text-zinc-400 transition select-none"
        title="Verschieben"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="5" cy="4" r="1.5"/>
          <circle cx="11" cy="4" r="1.5"/>
          <circle cx="5" cy="8" r="1.5"/>
          <circle cx="11" cy="8" r="1.5"/>
          <circle cx="5" cy="12" r="1.5"/>
          <circle cx="11" cy="12" r="1.5"/>
        </svg>
      </div>

      {/* Teil */}
      <div>
        <div className="mb-2 text-sm text-zinc-500">Teil</div>
        <div className="rounded-xl border border-zinc-800 bg-black px-4 py-3 text-zinc-300">
          {item.part_type}
        </div>
      </div>

      {/* Optionaler Text */}
      <label className="block">
        <div className="mb-2 text-sm text-zinc-500">
          Optionaler Text{" "}
          <span className="text-zinc-600">(leer = Standard)</span>
        </div>
        <input
          value={item.value ?? ""}
          onChange={(e) => onUpdate(item.id, { value: e.target.value })}
          className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none"
          placeholder={placeholder}
        />
      </label>

      {/* Anzeigen */}
      <label className="flex items-center gap-3 self-end pb-2">
        <input
          type="checkbox"
          checked={item.is_enabled}
          onChange={(e) => onUpdate(item.id, { is_enabled: e.target.checked })}
        />
        <span className="text-zinc-300">Anzeigen</span>
      </label>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function DateDisplayPage() {
  const [languages, setLanguages] = useState<LanguageItem[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState("bern");
  const [items, setItems] = useState<DateDisplayPart[]>([]);
  const [baseDateParts, setBaseDateParts] = useState<DatePart[]>([]);
  const [previewTimeText, setPreviewTimeText] = useState("...");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    async function loadLanguages() {
      const { data } = await supabase
        .from("languages")
        .select("code, label, active")
        .eq("active", true)
        .order("label", { ascending: true });

      const rows = (data ?? []) as LanguageItem[];
      setLanguages(rows);
      if (rows.length > 0) setSelectedLanguage(rows[0].code);
    }
    loadLanguages();
  }, []);

  useEffect(() => {
    if (!selectedLanguage) return;

    async function loadAll() {
      setLoading(true);
      setItems([]);
      setBaseDateParts([]);

      const [dateParts, timeText, displayResult] = await Promise.all([
        formatLocalizedDateParts(previewNow, selectedLanguage),
        formatBerneseTime(previewNow, selectedLanguage),
        supabase
          .from("date_display_parts")
          .select("id, language, position, part_type, label, value, is_enabled")
          .eq("language", selectedLanguage)
          .order("position", { ascending: true }),
      ]);

      setBaseDateParts(dateParts);
      setPreviewTimeText(timeText);
      setItems((displayResult.data ?? []) as DateDisplayPart[]);
      setLoading(false);
    }

    loadAll();
  }, [selectedLanguage]);

  function updateItem(id: string, patch: Partial<DateDisplayPart>) {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setItems((prev) => {
      const oldIndex = prev.findIndex((i) => i.id === active.id);
      const newIndex = prev.findIndex((i) => i.id === over.id);
      const reordered = arrayMove(prev, oldIndex, newIndex);

      // Positionen neu nummerieren
      return reordered.map((item, index) => ({
        ...item,
        position: index + 1,
      }));
    });
  }

  async function saveAll() {
    setSaving(true);

    // Schritt 1: Temporäre Positionen (1000+) setzen um Unique-Constraint Konflikte zu vermeiden
    const tempPayload = items.map((item, index) => ({
      id: item.id,
      language: item.language,
      position: index + 1000,
      part_type: item.part_type,
      label: item.label,
      value: item.value,
      is_enabled: item.is_enabled,
    }));

    await supabase.from("date_display_parts").upsert(tempPayload);

    // Schritt 2: Echte Positionen setzen
    const finalPayload = items.map((item) => ({
      id: item.id,
      language: item.language,
      position: item.position,
      part_type: item.part_type,
      label: item.label,
      value: item.value,
      is_enabled: item.is_enabled,
    }));

    const { error } = await supabase
      .from("date_display_parts")
      .upsert(finalPayload);

    setSaving(false);

    if (error) {
      console.error("Fehler beim Speichern:", JSON.stringify(error, null, 2));
      return;
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 1500);

    const [dateParts, timeText] = await Promise.all([
      formatLocalizedDateParts(previewNow, selectedLanguage),
      formatBerneseTime(previewNow, selectedLanguage),
    ]);
    setBaseDateParts(dateParts);
    setPreviewTimeText(timeText);
  }

  const previewDateParts = useMemo<DatePart[]>(() => {
    if (items.length === 0) return baseDateParts;

    const baseByType = new Map(
      baseDateParts.map((part) => [part.type, part.value])
    );

    return [...items]
      .filter((item) => item.is_enabled)
      .sort((a, b) => a.position - b.position)
      .map<DatePart | null>((item) => {
        const defaultValue = baseByType.get(item.part_type) ?? "";
        const finalValue = item.value?.trim() ? item.value.trim() : defaultValue;
        if (!finalValue.trim()) return null;
        return { type: item.part_type, value: finalValue };
      })
      .filter((part): part is DatePart => part !== null);
  }, [items, baseDateParts]);

  const previewState = useMemo<ClockDisplayState>(() => {
    const dateText = previewDateParts.map((p) => p.value).join(" ").trim();
    return { ...previewFallbackState, dateText, timeText: previewTimeText };
  }, [previewDateParts, previewTimeText]);

  return (
    <div className="text-white">
      <div className="mb-8">
        <div className="mb-2 text-xs uppercase tracking-[0.35em] text-zinc-400">Admin</div>
        <h1 className="text-5xl font-semibold tracking-tight">Datums-Anzeige</h1>
        <p className="mt-3 text-zinc-400">
          Reihenfolge per Drag & Drop ändern, Wörter überschreiben, Teile ein-/ausschalten.
        </p>
      </div>

      <div className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-6">
        {/* Sprache + Speichern */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-[280px_auto] md:items-end">
          <label className="block">
            <div className="mb-2 text-zinc-400">Sprache</div>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full rounded-2xl border border-zinc-800 bg-black px-5 py-4 text-white outline-none"
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.label} ({lang.code})
                </option>
              ))}
            </select>
          </label>

          <div className="flex gap-4">
            <button
              onClick={saveAll}
              disabled={saving}
              className={[
                "rounded-full px-6 py-3 transition",
                saving
                  ? "cursor-not-allowed bg-zinc-300 text-black opacity-70"
                  : "bg-white text-black",
              ].join(" ")}
            >
              {saving ? "Speichere..." : "Speichern"}
            </button>
            {saved && <div className="self-center text-green-400">✓ gespeichert</div>}
          </div>
        </div>

        {/* Vorschau */}
        <div className="mb-8 rounded-[1.75rem] border border-zinc-800 p-6">
          <div className="mb-4 text-xs uppercase tracking-[0.35em] text-zinc-500">
            Vorschau · 23. März 2026 · 17:55
          </div>
          <ClockDisplay
            state={previewState}
            showDigitalTime={true}
            showDate={true}
            now={previewNow}
          />
        </div>

        {/* Drag & Drop Liste */}
        {loading ? (
          <div className="text-zinc-500">Lade...</div>
        ) : items.length === 0 ? (
          <div className="text-zinc-500">Keine Einträge für diese Sprache.</div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items.map((i) => i.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="grid gap-4">
                {[...items]
                  .sort((a, b) => a.position - b.position)
                  .map((item) => (
                    <SortableRow
                      key={item.id}
                      item={item}
                      baseDateParts={baseDateParts}
                      onUpdate={updateItem}
                    />
                  ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}
