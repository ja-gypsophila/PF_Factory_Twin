import { getLevelBarClass, getLevelTextClass } from "../theme/levels";

// metric: theme/levels의 지표 키 (oee/availability/performance/quality 등)
// 값에 따라 채움 색이 자동으로 ok/warn/danger 로 결정된다.
export default function ProgressBar({ label, value, metric = "oee" }) {
  const clamped = Math.min(100, Math.max(0, Number(value)));
  const barColor = getLevelBarClass(metric, clamped);
  const textColor = getLevelTextClass(metric, clamped);

  return (
    <div className="w-full">
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="hud-label">{label}</span>
        <span className={`readout text-sm font-semibold ${textColor}`}>
          {clamped.toFixed(1)}%
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-hairline">
        <div
          className={`h-full rounded-full ${barColor} transition-all duration-500`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
