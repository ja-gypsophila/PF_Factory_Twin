// HMI 계기 리드아웃 타일
// - 상단: 대문자 HUD 라벨
// - 하단: 큰 모노 수치 + 흐린 단위

import { formatCompact } from "../utils/formatNumber";

// - tone: "ok" | "warning" | "danger" | "accent" 지정 시 수치에 발광 색 적용
const TONE = {
  ok: "text-ok",
  warn: "text-warning",
  danger: "text-danger",
  accent: "text-accent",
};

export default function StatTile({ label, value, unit, tone }) {
  return (
    <div className="panel group px-4 py-3.5 transition-colors hover:bg-raised/60">
      <div className="hud-label">{label}</div>
      <div className="mt-1.5 flex items-baseline gap-1">
        <span
          className={`readout text-25 font-semibold leading-none ${tone ? TONE[tone] : "text-ink"}`}
        >
          {formatCompact(value) ?? "—"}
        </span>
        {unit && <span className="text-xs text-faint">{unit}</span>}
      </div>
    </div>
  );
}
