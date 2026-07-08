import { calculateOee } from "../utils/calculateOee";

// 대시보드 상단 KPI 카드용 "공장 전체" 통계를 한 번에 계산한다.
// 인자 machines = 서버가 보낸 datacc.machines (기계 여러 대의 배열)
export default function getFactoryStats(machines) {
  if (!machines?.length) return null; // 데이터 도착 전(null/빈배열)이면 통계 없음

  // reduce로 모든 기계를 한 바퀴 돌며 값들을 누적한다.
  const acc = machines.reduce(
    (acc, machine) => {
      const { metrics, targets, status } = machine; // 기계 한 대에서 필요한 3덩어리 꺼냄

      // ── 생산 수량 누적 ──
      acc.totalCount += metrics.totalCount; // 총 생산량(양품+불량) 합
      acc.defectCount += metrics.defectCount; // 불량 수량 합

      // ── 시간 누적 (가동률 계산용) ──
      acc.plannedTime += metrics.plannedTimeSec; // 계획시간(전원 켜진 총 시간) 합
      acc.runTime += metrics.runTimeSec; // 실제 가동시간(RUNNING 상태 시간) 합

      // ── OEE 누적 ──
      acc.oeeSum += calculateOee(metrics).oee; // 각 기계 현재 OEE(0~1)를 더함(→평균낼 것)
      acc.oeeTargetSum += targets.oee; // 각 기계 목표 OEE(0~1)를 더함(→평균낼 것)

      // ── 목표 생산량 = 설비별 고정 목표(dailyCount)의 합 ──
      acc.targetCount += targets.dailyCount; // 서버가 관리하는 고정값 (매 틱 안 변함)

      // ── 설비 대수 카운트 ──
      if (status === "RUNNING")
        acc.runningCount += 1; // 가동 중 설비 수
      else acc.stoppedCount += 1; // 정지(대기 IDLE + 고장 DOWN) 설비 수

      // 목표 품질(불량률 목표 계산에 씀). 기계마다 같다고 보고 마지막 값 저장
      acc.qualityTarget = targets.quality;

      // 설비 가동률
      acc.availabilityTargetSum += targets.availability;

      return acc;
    },
    // ↓ 누적 초기값 (모든 합계는 0에서 시작)
    {
      totalCount: 0, // 총 생산량 누적
      defectCount: 0, // 불량 수량 누적
      plannedTime: 0, // 계획시간 누적
      runTime: 0, // 가동시간 누적
      oeeSum: 0, // OEE 합 (평균용)
      oeeTargetSum: 0, // 목표 OEE 합 (평균용)
      availabilityTargetSum: 0, // 목표 설비 가동률
      targetCount: 0, // 목표 생산량 누적
      runningCount: 0, // 가동 설비 수
      stoppedCount: 0, // 정지 설비 수
      qualityTarget: 0, // 목표 품질(0~1)
    },
  );

  const n = machines.length; // 전체 기계 수 (평균 낼 때 나눔)

  return {
    avgOee: (acc.oeeSum / n) * 100, // 82.0
    targetOee: (acc.oeeTargetSum / n) * 100, // 80

    totalCount: acc.totalCount, // 개수는 그대로
    targetCount: Math.round(acc.targetCount),

    defectRate:
      acc.totalCount > 0 ? (acc.defectCount / acc.totalCount) * 100 : 0, // 1.0
    targetDefectRate: (1 - acc.qualityTarget) * 100, // 2.0

    availability:
      acc.plannedTime > 0 ? (acc.runTime / acc.plannedTime) * 100 : 0, // 91.2
    targetAvailability: (acc.availabilityTargetSum / n) * 100,
    runningCount: acc.runningCount,
    stoppedCount: acc.stoppedCount,
  };
}
