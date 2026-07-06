// 초 → "16:50" (분:초) 형식
export function formatMinSec(totalSec) {
  const min = Math.floor(totalSec / 60); // 몫 = 분
  const sec = Math.round(totalSec % 60); // 나머지 = 초
  return `${min}:${String(sec).padStart(2, "0")}`; // 초는 2자리로 (05, 50)
}
