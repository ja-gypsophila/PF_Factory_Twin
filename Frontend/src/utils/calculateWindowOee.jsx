import { calculateOee } from "./calculateOee";

// history의 endIndex 시점에서 "최근 windowSize 틱" 공장 평균 OEE(%)
export function factoryWindowOee(history, endIndex, windowSize = 10) {
  if (endIndex < 1) return 0;
  const now = history[endIndex];
  const past = history[Math.max(0, endIndex - windowSize)];

  const oees = now.machines
    .map((m) => {
      const prev = past.machines.find(
        (p) => p.machineId === m.machineId,
      )?.metrics;
      if (!prev) return null;
      const cur = m.metrics;
      const delta = {
        plannedTimeSec: cur.plannedTimeSec - prev.plannedTimeSec,
        runTimeSec: cur.runTimeSec - prev.runTimeSec,
        idealCycleTimeSec: cur.idealCycleTimeSec, // 고정값 → 델타 X
        totalCount: cur.totalCount - prev.totalCount,
        goodCount: cur.goodCount - prev.goodCount,
      };
      return calculateOee(delta).oee;
    })
    .filter((v) => v !== null);

  if (!oees.length) return 0;
  return (oees.reduce((a, b) => a + b, 0) / oees.length) * 100;
}
