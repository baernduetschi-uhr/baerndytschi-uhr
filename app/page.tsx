"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getAppSetting } from "@/lib/getAppSetting";
import { getClockData } from "@/src/server/services/getClockData";
import { ClockDisplay } from "@/src/components/clock/ClockDisplay";
import type { ResolvedHoliday } from "@/src/domain/holidays/types";
import type { MealWindow } from "@/src/domain/meal-windows/types";
import type { ClockDisplayState } from "@/src/domain/clock/types";
import { getResolvedHolidays } from "@/src/lib/getResolvedHolidays";

type LanguageOption = {
  code: string;
  label: string;
  active: boolean;
  group_name: string | null;
  region: string | null;
};

const fallbackDisplayState: ClockDisplayState = {
  holidayText: "",
  mealText: "",
  timeText: "Lade...",
  dateText: "",
  digitalText: "",
  digitalDateText: "",
  theme: "default",
  holiday: null,
  meal: null,
};

function toBoolean(value: string | null, fallback: boolean) {
  if (value === null) return fallback;
  return value === "true";
}


// ─── Baum aus DB aufbauen ────────────────────────────────────────────────────

type TreeNode = {
  group: string;
  regions: {
    region: string;
    subRegions: { subRegion: string; languages: LanguageOption[] }[];
    languages: LanguageOption[];
  }[];
};

function buildTree(languages: LanguageOption[]): TreeNode[] {
  const groupMap = new Map<string, Map<string, Map<string, LanguageOption[]>>>();
  for (const lang of languages) {
    const group = lang.group_name ?? "Andere";
    const parts = (lang.region ?? "Andere").split("/");
    const region = parts[0].trim();
    const subRegion = parts[1]?.trim() ?? "__root__";
    if (!groupMap.has(group)) groupMap.set(group, new Map());
    const rm = groupMap.get(group)!;
    if (!rm.has(region)) rm.set(region, new Map());
    const sm = rm.get(region)!;
    if (!sm.has(subRegion)) sm.set(subRegion, []);
    sm.get(subRegion)!.push(lang);
  }
  return [...groupMap.entries()].map(([group, rm]) => ({
    group,
    regions: [...rm.entries()].map(([region, sm]) => ({
      region,
      subRegions: [...sm.entries()].filter(([sr]) => sr !== "__root__").map(([subRegion, langs]) => ({ subRegion, languages: langs })),
      languages: sm.get("__root__") ?? [],
    })),
  }));
}

// ─── Dropdown ────────────────────────────────────────────────────────────────

type LevelState =
  | { type: "root" }
  | { type: "group"; group: string }
  | { type: "region"; group: string; region: string }
  | { type: "subregion"; group: string; region: string; subRegion: string };

type DropdownProps = {
  languages: LanguageOption[];
  activeLanguage: string;
  switching: boolean;
  onSelect: (code: string) => void;
};

function LanguageDropdown({ languages, activeLanguage, switching, onSelect }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [level, setLevel] = useState<LevelState>({ type: "root" });
  const ref = useRef<HTMLDivElement>(null);
  const tree = buildTree(languages);
  const active = languages.find(l => l.code === activeLanguage);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false); setLevel({ type: "root" });
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function close() { setOpen(false); setLevel({ type: "root" }); }
  function handleSelect(code: string) { onSelect(code); close(); }

  const ps: React.CSSProperties = {
    position: "absolute", top: "calc(100% + 8px)", right: 0, minWidth: "240px",
    background: "rgba(12,12,12,0.96)", border: "0.5px solid rgba(255,255,255,0.12)",
    borderRadius: "16px", overflow: "hidden", zIndex: 100,
    backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
  };

  const gh = (label: string) => (
    <div style={{ padding: "10px 16px 4px", fontSize: "10px", fontWeight: 500, letterSpacing: "0.16em", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.3)" }}>{label}</div>
  );

  const back = (label: string, onClick: () => void) => (
    <button onClick={onClick} style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", padding: "10px 16px", background: "transparent", border: "none", borderBottom: "0.5px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)", fontSize: "12px", cursor: "pointer", textAlign: "left" as const, marginBottom: "4px" }}
      onMouseEnter={(e) => (e.currentTarget.style.color = "white")}
      onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      {label}
    </button>
  );

  const item = (lang: LanguageOption) => {
    const isActive = lang.code === activeLanguage;
    return (
      <button key={lang.code} onClick={() => handleSelect(lang.code)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "9px 16px", background: isActive ? "rgba(255,255,255,0.08)" : "transparent", border: "none", color: isActive ? "white" : "rgba(255,255,255,0.65)", fontSize: "13px", fontWeight: isActive ? 500 : 400, cursor: "pointer", textAlign: "left" as const }}
        onMouseEnter={(e) => { if (!isActive) { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)"; (e.currentTarget as HTMLButtonElement).style.color = "white"; } }}
        onMouseLeave={(e) => { if (!isActive) { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.65)"; } }}>
        <span>{lang.label}</span>
        <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.05)", padding: "2px 6px", borderRadius: "4px" }}>{lang.code.toUpperCase()}</span>
      </button>
    );
  };

  const folder = (label: string, onClick: () => void) => (
    <button onClick={onClick} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "10px 16px", background: "transparent", border: "none", color: "rgba(255,255,255,0.8)", fontSize: "13px", fontWeight: 500, cursor: "pointer", textAlign: "left" as const }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
      <span>{label}</span>
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ opacity: 0.4 }}><path d="M4 2L8 6L4 10" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
    </button>
  );

  const div = () => <div style={{ height: "0.5px", background: "rgba(255,255,255,0.07)", margin: "4px 0" }} />;

  const curGroup = level.type !== "root" ? tree.find(g => g.group === level.group) : null;
  const curRegion = (level.type === "region" || level.type === "subregion") && curGroup
    ? curGroup.regions.find(r => r.region === level.region) : null;

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button onClick={() => { if (!switching) { setOpen(o => !o); setLevel({ type: "root" }); } }} disabled={switching}
        style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", borderRadius: "99px", border: "0.5px solid rgba(255,255,255,0.2)", background: open ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)", color: "white", fontSize: "12px", letterSpacing: "0.12em", textTransform: "uppercase" as const, cursor: switching ? "not-allowed" : "pointer", transition: "all 0.15s", opacity: switching ? 0.5 : 1, whiteSpace: "nowrap" }}>
        <span>{active?.label ?? activeLanguage}</span>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)", opacity: 0.5 }}>
          <path d="M2 3.5L5 6.5L8 3.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div style={ps}>
          {/* ROOT */}
          {level.type === "root" && tree.map((g, i) => (
            <div key={g.group}>{i > 0 && div()}{folder(g.group, () => setLevel({ type: "group", group: g.group }))}</div>
          ))}

          {/* GROUP */}
          {level.type === "group" && curGroup && (
            <>
              {back("Zurück", () => setLevel({ type: "root" }))}
              {gh(curGroup.group)}
              {curGroup.regions.map((r, i) => (
                <div key={r.region}>
                  {i > 0 && div()}
                  {r.subRegions.length === 0
                    ? <>{gh(r.region)}{r.languages.map(item)}</>
                    : <>{folder(r.region, () => setLevel({ type: "region", group: curGroup.group, region: r.region }))}
                        {r.languages.map(item)}</>
                  }
                </div>
              ))}
            </>
          )}

          {/* REGION */}
          {level.type === "region" && curGroup && curRegion && (
            <>
              {back(curGroup.group, () => setLevel({ type: "group", group: curGroup.group }))}
              {gh(curRegion.region)}
              {curRegion.languages.map(item)}
              {curRegion.subRegions.length > 0 && curRegion.languages.length > 0 && div()}
              {curRegion.subRegions.map((sr, i) => (
                <div key={sr.subRegion}>{i > 0 && div()}{folder(sr.subRegion, () => setLevel({ type: "subregion", group: curGroup.group, region: curRegion.region, subRegion: sr.subRegion }))}</div>
              ))}
            </>
          )}

          {/* SUBREGION */}
          {level.type === "subregion" && curGroup && curRegion && (() => {
            const sub = curRegion.subRegions.find(sr => sr.subRegion === (level as {type:"subregion";subRegion:string}).subRegion);
            return sub ? (
              <>
                {back(curRegion.region, () => setLevel({ type: "region", group: curGroup.group, region: curRegion.region }))}
                {gh(sub.subRegion)}
                {sub.languages.map(item)}
              </>
            ) : null;
          })()}
        </div>
      )}
    </div>
  );
}

// ─── Home Page ────────────────────────────────────────────────────────────────

export default function Home() {
  const [now, setNow] = useState(new Date());
  const [meals, setMeals] = useState<MealWindow[]>([]);
  const [holidays, setHolidays] = useState<ResolvedHoliday[]>([]);
  const [languages, setLanguages] = useState<LanguageOption[]>([]);
  const [activeLanguage, setActiveLanguage] = useState("be");
  const [showDigitalTime, setShowDigitalTime] = useState(true);
  const [showDate, setShowDate] = useState(true);
  const [animate, setAnimate] = useState(false);
  const [switchingLanguage, setSwitchingLanguage] = useState(false);
  const [displayState, setDisplayState] = useState<ClockDisplayState>(fallbackDisplayState);
  const [holidayYear, setHolidayYear] = useState(new Date().getFullYear());

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | undefined;
    const syncToMinute = () => {
      setNow(new Date());
      intervalId = setInterval(() => setNow(new Date()), 60_000);
    };
    const delay = 60_000 - (Date.now() % 60_000);
    const timeoutId = setTimeout(syncToMinute, delay);
    setNow(new Date());
    return () => { clearTimeout(timeoutId); if (intervalId) clearInterval(intervalId); };
  }, []);

  useEffect(() => {
    if (now.getFullYear() !== holidayYear) setHolidayYear(now.getFullYear());
  }, [now, holidayYear]);

  useEffect(() => {
    async function loadSettings() {
      const [language, digital, dateVisible] = await Promise.all([
        getAppSetting("active_language"),
        getAppSetting("show_digital_time"),
        getAppSetting("show_date"),
      ]);
      setActiveLanguage(language ?? "be");
      setShowDigitalTime(toBoolean(digital, true));
      setShowDate(toBoolean(dateVisible, true));
    }
    loadSettings();
  }, []);

  useEffect(() => {
    async function loadLanguages() {
      const { data, error } = await supabase
        .from("languages")
        .select("code, label, active, group_name, region")
        .eq("active", true)
        .order("label", { ascending: true });
      if (error) { console.error("languages error:", error); return; }
      setLanguages((data ?? []) as LanguageOption[]);
    }
    loadLanguages();
  }, []);

  useEffect(() => {
    async function loadMeals() {
      const { data, error } = await supabase
        .from("meal_windows")
        .select("id, key, label, from, to, active")
        .order("from", { ascending: true });
      if (error) { console.error("meal error:", error); return; }
      setMeals((data ?? []) as MealWindow[]);
    }
    loadMeals();
  }, []);

  useEffect(() => {
    async function loadHolidays() {
      try {
        const data = await getResolvedHolidays(holidayYear);
        setHolidays(data as ResolvedHoliday[]);
      } catch (error) { console.error("holiday error:", error); }
    }
    loadHolidays();
  }, [holidayYear]);

  useEffect(() => {
    async function buildDisplayState() {
      const nextState = await getClockData({ now, language: activeLanguage, holidays, meals, showDate });
      setAnimate(false);
      requestAnimationFrame(() => { setDisplayState(nextState); setAnimate(true); });
    }
    buildDisplayState();
  }, [now, activeLanguage, holidays, meals, showDate]);

  async function changeLanguage(code: string) {
    if (code === activeLanguage || switchingLanguage) return;
    setSwitchingLanguage(true);
    const { error } = await supabase
      .from("app_settings")
      .update({ value: code })
      .eq("key", "active_language");
    if (error) { console.error("Sprachwechsel error:", error); setSwitchingLanguage(false); return; }
    setActiveLanguage(code);
    setSwitchingLanguage(false);
  }

  const isHoliday = !!displayState.holidayText;

  return (
    <main className="min-h-screen overflow-hidden bg-black text-white">
      <div className="relative flex min-h-screen items-center justify-center px-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),transparent_45%)]" />

        {isHoliday && (
          <>
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,225,170,0.16),transparent_36%)]" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(255,255,255,0.04),transparent_42%)]" />
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-[38rem] w-[38rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/6 opacity-40" />
          </>
        )}

        {/* Dropdown oben rechts */}
        <div className="absolute right-6 top-6 z-50">
          {languages.length > 0 && (
            <LanguageDropdown
              languages={languages}
              activeLanguage={activeLanguage}
              switching={switchingLanguage}
              onSelect={changeLanguage}
            />
          )}
        </div>

        <div className={[
          "w-full transition-all duration-500 ease-out",
          animate ? "translate-y-0 scale-100 opacity-100" : "translate-y-2 scale-[0.985] opacity-0",
        ].join(" ")}>
          <ClockDisplay
            state={displayState}
            showDigitalTime={showDigitalTime}
            showDate={showDate}
            now={now}
          />
        </div>
      </div>
    </main>
  );
}
