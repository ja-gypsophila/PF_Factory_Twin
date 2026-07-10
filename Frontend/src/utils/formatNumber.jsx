// 큰 숫자를 짧게 축약 (1,000 이상 → k / M)
//   950     → "950"
//   5000    → "5k"
//   12800   → "12.8k"
//   1200000 → "1.2M"
// 1000 미만은 그대로 (퍼센트·온도 등은 영향 없음)
export function formatCompact(value, digits = 1) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—"; // 숫자 아님(undefined 등) 방어

  const abs = Math.abs(n);
  if (abs >= 1_000_000) return trimZero((n / 1_000_000).toFixed(digits)) + "M";
  if (abs >= 1_000) return trimZero((n / 1_000).toFixed(digits)) + "k";

  return trimZero(String(n));
}

// "5.0" → "5" 처럼 불필요한 소수 0 제거
function trimZero(s) {
  return s.replace(/\.0+$/, "");
}
