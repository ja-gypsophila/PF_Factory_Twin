import { ChevronUp, ChevronDown } from "lucide-react";
import { LEVEL_TEXT } from "../theme/levels";

export default function KpiCard({
  label,
  current,
  unit,
  target,
  good,
  dec = 1,
}) {
  const calcGap = Number((current - target).toFixed(dec));
  const isGood = good ? calcGap >= 0 : calcGap <= 0;
  const gapColor = isGood ? LEVEL_TEXT.ok : LEVEL_TEXT.danger;
  const Arrow = calcGap > 0 ? ChevronUp : ChevronDown;

  return (
    <div className="panel w-full px-15 py-10">
      <div className="hud-label">{label}</div>

      <div className="mt-1.5 flex items-baseline gap-1">
        <span className="readout text-25 sm:text-35 lg:text-50 font-semibold leading-none text-ink">
          {Number(current).toFixed(dec)}
        </span>
        {unit && <span className="text-xl text-faint">{unit}</span>}
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between">
        <span className="text-sm sm:text-lg lg:text-xl text-faint">
          <span className="font-sans">목표</span>{" "}
          <span className="readout">{Number(target).toFixed(dec)}</span>
          {unit}
        </span>
        <span
          className={`readout flex items-center gap-0.5 text-ms sm:text-lg lg:text-xl font-semibold ${gapColor}`}
        >
          <Arrow size={13} strokeWidth={2.5} />
          {Math.abs(calcGap)}
          {unit}
        </span>
      </div>
    </div>
  );
}
