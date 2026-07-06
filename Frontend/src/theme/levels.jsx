// ────────────────────────────────────────────────────────────
// 수치 → 등급(level) → 색 을 한 곳에서 통제하는 "레벨 시스템"
//
// 색이나 기준을 바꾸고 싶으면 이 파일만 수정하면 전체에 반영된다.
// (getGrade, KpiCard, ProgressBar 등 흩어진 색 판정을 여기로 통합)
// ────────────────────────────────────────────────────────────

// 지표별 기준값 + 방향(높을수록 좋은지)
// higherBetter: true  → 값이 클수록 좋음 (OEE, 가동률 등)
// higherBetter: false → 값이 작을수록 좋음 (불량률, 온도 등)
export const METRIC_CONFIG = {
  oee:          { good: 85, warn: 70, higherBetter: true },
  availability: { good: 88, warn: 75, higherBetter: true },
  performance:  { good: 90, warn: 80, higherBetter: true },
  quality:      { good: 98, warn: 95, higherBetter: true },
  defectRate:   { good: 1,  warn: 3,  higherBetter: false },
  temperature:  { good: 35, warn: 40, higherBetter: false },
};

// 등급 → Tailwind 클래스 (색은 tailwind.config의 의미 색과 연결)
export const LEVEL_TEXT = {
  ok: "text-ok",
  warn: "text-warning",
  danger: "text-danger",
};

export const LEVEL_BG = {
  ok: "bg-ok/10 text-ok",
  warn: "bg-warning/10 text-warning",
  danger: "bg-danger/10 text-danger",
};

// 진행바 채움처럼 "꽉 찬 배경색"이 필요할 때
export const LEVEL_BAR = {
  ok: "bg-ok",
  warn: "bg-warning",
  danger: "bg-danger",
};

// 등급 → 한글 라벨 (getGrade 등에서 사용)
export const LEVEL_LABEL = {
  ok: "양호",
  warn: "주의",
  danger: "위험",
};

// 지표 키 + 값 → 등급("ok" | "warn" | "danger")
// 지표별 기준/방향은 METRIC_CONFIG에서 자동으로 가져온다.
export function getLevel(metricKey, value) {
  const config = METRIC_CONFIG[metricKey];
  if (!config) return "ok"; // 미등록 지표는 기본 ok

  const { good, warn, higherBetter } = config;
  const meetsGood = higherBetter ? value >= good : value <= good;
  const meetsWarn = higherBetter ? value >= warn : value <= warn;

  if (meetsGood) return "ok";
  if (meetsWarn) return "warn";
  return "danger";
}

// 등급을 곧바로 클래스로 받고 싶을 때 쓰는 헬퍼
export function getLevelTextClass(metricKey, value) {
  return LEVEL_TEXT[getLevel(metricKey, value)];
}

export function getLevelBgClass(metricKey, value) {
  return LEVEL_BG[getLevel(metricKey, value)];
}

export function getLevelBarClass(metricKey, value) {
  return LEVEL_BAR[getLevel(metricKey, value)];
}