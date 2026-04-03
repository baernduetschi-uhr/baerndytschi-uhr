import type { ClockDisplayState } from "@/src/domain/clock/types";

type Props = {
  state: ClockDisplayState;
  showDigitalTime: boolean;
  showDate: boolean;
  now: Date;
};

type BadgeStyle = {
  borderColor: string;
  backgroundColor: string;
  color: string;
  boxShadow: string;
};

const colorStyles: Record<string, BadgeStyle> = {
  pink:   { borderColor: "rgba(244,114,182,0.25)", backgroundColor: "rgba(236,72,153,0.08)",   color: "#fbcfe8", boxShadow: "0 0 30px rgba(236,72,153,0.08)" },
  blue:   { borderColor: "rgba(96,165,250,0.25)",  backgroundColor: "rgba(59,130,246,0.08)",   color: "#bfdbfe", boxShadow: "0 0 30px rgba(59,130,246,0.08)" },
  red:    { borderColor: "rgba(248,113,113,0.25)", backgroundColor: "rgba(239,68,68,0.08)",    color: "#fecaca", boxShadow: "0 0 30px rgba(239,68,68,0.08)" },
  gold:   { borderColor: "rgba(242,217,166,0.25)", backgroundColor: "rgba(242,217,166,0.08)",  color: "#f7e7c1", boxShadow: "0 0 30px rgba(242,217,166,0.08)" },
  white:  { borderColor: "rgba(255,255,255,0.15)", backgroundColor: "rgba(255,255,255,0.05)",  color: "rgba(255,255,255,0.7)", boxShadow: "0 0 30px rgba(255,255,255,0.05)" },
  green:  { borderColor: "rgba(74,222,128,0.25)",  backgroundColor: "rgba(74,222,128,0.08)",   color: "#bbf7d0", boxShadow: "0 0 30px rgba(74,222,128,0.08)" },
  purple: { borderColor: "rgba(192,132,252,0.25)", backgroundColor: "rgba(192,132,252,0.08)",  color: "#e9d5ff", boxShadow: "0 0 30px rgba(192,132,252,0.08)" },
  orange: { borderColor: "rgba(251,146,60,0.25)",  backgroundColor: "rgba(251,146,60,0.08)",   color: "#fed7aa", boxShadow: "0 0 30px rgba(251,146,60,0.08)" },
};

function getStyle(color: string): BadgeStyle {
  return colorStyles[color] ?? colorStyles.white;
}

function Badge({ text, color }: { text: string; color: string }) {
  const s = getStyle(color);
  
  return (
    <div style={{
      display: "inline-flex",
      alignItems: "center",
      borderRadius: "9999px",
      border: `1px solid ${s.borderColor}`,
      backgroundColor: s.backgroundColor,
      color: s.color,
      boxShadow: s.boxShadow,
      padding: "0.5rem 1.5rem",
      fontSize: "11px",
      textTransform: "uppercase",
      letterSpacing: "0.38em",
      backdropFilter: "blur(12px)",
    }}>
      {text}
    </div>
  );
}

export function ClockDisplay({ state, showDigitalTime, showDate }: Props) {
  const hasHoliday = !!state.holidayText;
  const hasBirthdays = state.birthdays.length > 0;
  const hasMeal = !!state.mealText;
  const hasDateText = !!state.dateText;
  const showDigitalRow = showDigitalTime && !!state.digitalText;

  return (
    <div className="relative mx-auto w-full max-w-6xl text-center">

      {hasHoliday && (
        <div className="mb-5">
          <Badge text={state.holidayText} color={state.holidayColor ?? "gold"} />
        </div>
      )}

      {hasBirthdays && (
        <div className="mb-5 flex flex-col items-center gap-2">
          {state.birthdays.map((birthday, i) => (
            <Badge key={i} text={birthday.text} color={birthday.color} />
          ))}
        </div>
      )}

      {hasMeal && (
        <div className="mb-6">
          <Badge text={state.mealText} color={state.mealColor ?? "white"} />
        </div>
      )}

      <div className="mx-auto max-w-6xl">
        <h1 className={[
          "text-balance font-semibold leading-[0.92] tracking-tight",
          hasHoliday
            ? "text-[clamp(4rem,11vw,8.5rem)] text-[#fff8ea] drop-shadow-[0_0_34px_rgba(255,232,180,0.12)]"
            : "text-[clamp(3.5rem,10vw,7.5rem)] text-white",
        ].join(" ")}>
          {state.timeText || "Lade..."}
        </h1>

        {hasDateText && showDate && (
          <p className={[
            "mx-auto mt-8 max-w-5xl font-medium",
            hasHoliday
              ? "text-[clamp(1.2rem,2.6vw,1.95rem)] text-[#f5ead0]/82"
              : "text-[clamp(1.1rem,2.4vw,1.8rem)] text-white/60",
          ].join(" ")}>
            {state.dateText}
          </p>
        )}

        {showDigitalRow && (
          <div className="mt-10 text-[clamp(1.1rem,1.8vw,1.4rem)] tracking-wide text-white/28">
            {state.digitalText}
            {showDate && state.digitalDateText && (
              <span className="ml-3 text-white/20">· {state.digitalDateText}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}