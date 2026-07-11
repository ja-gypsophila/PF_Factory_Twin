// ────────────────────────────────────────────────────────────
// SCADA/HMI 시그니처 패널
// - 상단 상태 스트립(accent) + 네 모서리 틱 마크로 "계기판" 느낌
// - title: 좌상단 HUD 라벨, right: 우상단 부가정보(수치/뱃지 등)
// - accent: "ok" | "warning" | "danger" | "accent" (상단 발광 스트립 색)
// ────────────────────────────────────────────────────────────

const STRIP = {
  ok: "bg-ok shadow-glow-ok",
  warn: "bg-warning shadow-glow-warning",
  danger: "bg-danger shadow-glow-danger",
  accent: "bg-accent shadow-glow-accent",
};

export default function Panel({
  title,
  right,
  goal,
  accent,
  className = "",
  bodyClassName = "",
  children,
  unit,
}) {
  return (
    <div className={`panel overflow-hidden ${className}`}>
      {/* 상단 상태 스트립 */}
      {accent && (
        <div
          className={`absolute inset-x-0 top-0 h-[2px] ${STRIP[accent] ?? STRIP.accent}`}
        />
      )}

      {/* 헤더 */}
      {(title || right) && (
        <div className="flex items-center justify-between gap-3 border-b border-hairline px-4 py-2.5">
          <span className="hud-label flex items-center gap-5">
            {accent && (
              <span
                className={`inline-block h-1.5 w-1.5 rounded-full ${STRIP[accent] ?? STRIP.accent}`}
              />
            )}
            {title}
          </span>
          {right && (
            <span className="text-md font-semibold text-white gap-6 flex">
              <span>{goal}</span>
              <span className="font-mono">
                {right}
                {unit}
              </span>
            </span>
          )}
        </div>
      )}

      {/* 본문 */}
      <div className={`p-8 ${bodyClassName}`}>{children}</div>
    </div>
  );
}
