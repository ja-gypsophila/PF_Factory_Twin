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
    <div className="panel group w-full px-4 py-3.5 transition-colors hover:bg-raised/60">
      <div className="hud-label">{label}</div>

      <div className="mt-1.5 flex items-baseline gap-1">
        <span className="readout text-25 font-semibold leading-none text-ink">
          {Number(current).toFixed(dec)}
        </span>
        {unit && <span className="text-xs text-faint">{unit}</span>}
      </div>

      <div className="mt-2 flex items-center justify-between">
        <span className="readout text-xs text-faint">
          목표 {Number(target).toFixed(dec)}
          {unit}
        </span>
        <span
          className={`readout flex items-center gap-0.5 text-xs font-semibold ${gapColor}`}
        >
          <Arrow size={13} strokeWidth={2.5} />
          {Math.abs(calcGap)}
          {unit}
        </span>
      </div>
    </div>
  );
}
