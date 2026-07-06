import { getLevelBarClass, getLevelTextClass } from "../theme/levels";

// metric: theme/levels의 지표 키 (oee/availability/performance/quality 등)
// 값에 따라 채움 색이 자동으로 ok/warn/danger 로 결정된다.
export default function ProgressBar({ label, value, metric = "oee" }) {
  const clamped = Math.min(100, Math.max(0, Number(value)));
  const bgColor = getLevelBarClass(metric, clamped);
  const textColor = getLevelTextClass(metric, clamped);

  return (
    <div className="w-full">
      <div className="flex justify-between">
        <div>{label}</div>
        <div className={`${textColor}`}>{clamped}</div>
      </div>
      <div
        className="w-full bg-slate-300 rounded-full h-7 md:h-10 overflow-hidden"
        title={`${clamped}`}
      >
        <div
          className={`h-full ${bgColor} rounded-full transition-all duration-300`}
          style={{ width: `${clamped}%` }}
        ></div>
      </div>
    </div>
  );
}
