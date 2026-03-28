import type { ClockDisplayState } from "@/src/domain/clock/types";

type Props = {
  state: ClockDisplayState;
  showDigitalTime: boolean;
  showDate: boolean;
  now: Date;
};

export function ClockDisplay({
  state,
  showDigitalTime,
  showDate,
}: Props) {
  const hasHoliday = !!state.holidayText;
  const hasMeal = !!state.mealText;
  const hasDateText = !!state.dateText;
  const showDigitalRow = showDigitalTime && !!state.digitalText;

  return (
    <div className="relative mx-auto w-full max-w-6xl text-center">
      {hasHoliday && (
        <div className="mb-5">
          <div className="inline-flex items-center rounded-full border border-[#f2d9a6]/25 bg-[#f2d9a6]/8 px-6 py-2 text-[11px] uppercase tracking-[0.38em] text-[#f7e7c1] shadow-[0_0_30px_rgba(242,217,166,0.08)] backdrop-blur-sm">
            {state.holidayText}
          </div>
        </div>
      )}

      {hasMeal && (
        <div className="mb-6">
          <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-5 py-2 text-xs uppercase tracking-[0.35em] text-white/45">
            {state.mealText}
          </div>
        </div>
      )}

      <div className="mx-auto max-w-6xl">
        <h1
          className={[
            "text-balance font-semibold leading-[0.92] tracking-tight",
            hasHoliday
              ? "text-[clamp(4rem,11vw,8.5rem)] text-[#fff8ea] drop-shadow-[0_0_34px_rgba(255,232,180,0.12)]"
              : "text-[clamp(3.5rem,10vw,7.5rem)] text-white",
          ].join(" ")}
        >
          {state.timeText || "Lade..."}
        </h1>

        {hasDateText && showDate && (
          <p
            className={[
              "mx-auto mt-8 max-w-5xl font-medium",
              hasHoliday
                ? "text-[clamp(1.2rem,2.6vw,1.95rem)] text-[#f5ead0]/82"
                : "text-[clamp(1.1rem,2.4vw,1.8rem)] text-white/60",
            ].join(" ")}
          >
            {state.dateText}
          </p>
        )}

        {showDigitalRow && (
          <div className="mt-10 text-[clamp(1.1rem,1.8vw,1.4rem)] tracking-wide text-white/28">
            {state.digitalText}
            {showDate && state.digitalDateText && (
              <span className="ml-3 text-white/20">
                · {state.digitalDateText}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}