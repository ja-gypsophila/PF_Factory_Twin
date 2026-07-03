import { calculateOee } from "../utils/calculateOee";

// 대시보드 상단 KPI 카드용 "공장 전체" 통계를 한 번에 계산한다.
// 인자 machines = 서버가 보낸 datacc.machines (기계 여러 대의 배열)
export default function getFactoryStats(machines) {
  if (!machines?.length) return null; // 데이터 도착 전(null/빈배열)이면 통계 없음

  // reduce로 모든 기계를 한 바퀴 돌며 값들을 누적한다.
  const acc = machines.reduce(
    (acc, machine) => {
      const { metrics, targets, status } = machine; // 기계 한 대에서 필요한 3덩어리 꺼냄
      console.log(machines);

      // ── 생산 수량 누적 ──
      acc.totalCount += metrics.totalCount; // 총 생산량(양품+불량) 합
      acc.defectCount += metrics.defectCount; // 불량 수량 합

      // ── 시간 누적 (가동률 계산용) ──
      acc.plannedTime += metrics.plannedTimeSec; // 계획시간(전원 켜진 총 시간) 합
      acc.runTime += metrics.runTimeSec; // 실제 가동시간(RUNNING 상태 시간) 합

      // ── OEE 누적 ──
      acc.oeeSum += calculateOee(metrics).oee; // 각 기계 현재 OEE(0~1)를 더함(→평균낼 것)
      acc.oeeTargetSum += targets.oee; // 각 기계 목표 OEE(0~1)를 더함(→평균낼 것)

      // ── 목표 생산량 = 이론상 최대 생산량 × 목표 OEE ──
      const theoreticalMax = // 이상 속도로 계획시간 내내 만들 때의 최대 개수
        metrics.idealCycleTimeSec > 0
          ? metrics.plannedTimeSec / metrics.idealCycleTimeSec
          : 0;
      acc.targetCount += theoreticalMax * targets.oee; // 현실적 목표 생산량 누적

      // ── 설비 대수 카운트 ──
      if (status === "RUNNING")
        acc.runningCount += 1; // 가동 중 설비 수
      else acc.stoppedCount += 1; // 정지(대기 IDLE + 고장 DOWN) 설비 수

      // 목표 품질(불량률 목표 계산에 씀). 기계마다 같다고 보고 마지막 값 저장
      acc.qualityTarget = targets.quality;

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
      targetCount: 0, // 목표 생산량 누적
      runningCount: 0, // 가동 설비 수
      stoppedCount: 0, // 정지 설비 수
      qualityTarget: 0, // 목표 품질(0~1)
    },
  );

  const n = machines.length; // 전체 기계 수 (평균 낼 때 나눔)

  return {
    // ▶ OEE 카드
    avgOee: acc.oeeSum / n, // 현재 평균 OEE (0~1) → 화면선 ×100 해서 %
    targetOee: acc.oeeTargetSum / n, // 목표 평균 OEE (0~1)

    // ▶ 금일 생산 카드
    totalCount: acc.totalCount, // 현재 총 생산량 (개)
    targetCount: Math.round(acc.targetCount), // 목표 생산량 (개, 소수 반올림)

    // ▶ 불량률 카드
    defectRate: acc.totalCount > 0 ? acc.defectCount / acc.totalCount : 0, // 현재 불량률(0~1)
    targetDefectRate: 1 - acc.qualityTarget, // 목표 불량률(0~1) = 1 − 목표품질(0.98→0.02)

    // ▶ 설비 가동률 카드
    availability: acc.plannedTime > 0 ? acc.runTime / acc.plannedTime : 0, // 가동률(0~1)=가동/계획시간
    runningCount: acc.runningCount, // 가동 설비 수 (예: 5)
    stoppedCount: acc.stoppedCount, // 정지 설비 수 (예: 3)
  };
}
