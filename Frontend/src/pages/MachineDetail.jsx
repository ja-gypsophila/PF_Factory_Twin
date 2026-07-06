import { Link, useParams } from "react-router-dom";
import { useWebSocketContext } from "../context/WebSocketProvider";
import { calculateOee } from "../utils/calculateOee";
import { formatTimestamp } from "../utils/formatTimestamp";
import { STATUS_LABEL, STATUS_COLOR } from "../constants/MACHINE_STATUS";
import LineChart from "../components/charts/LineChart";
import { formatMinSec } from "../utils/formatMinSec";
import ProgressBar from "../components/ProgressBar";
import StatTile from "../components/StatTile";
import { getLevelTextClass } from "../theme/levels";

export default function MachineDetail() {
  const { id } = useParams();
  const { data, history } = useWebSocketContext();
  const machine = data?.machines.find((m) => m.machineId === id);
  // 데이터 도착 전 / 잘못된 id 가드
  if (!machine) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-400">
        {data ? `설비 ${id} 를 찾을 수 없습니다.` : "데이터 로딩 중..."}
      </div>
    );
  }

  // 현재 OEE 3요소 (0~1)
  const { availability, performance, quality, oee } = calculateOee(
    machine.metrics,
  );
  const { runTimeSec, downTimeSec, downCount } = machine.metrics;
  const { targets, metrics } = machine;

  const MIN_FAILURES = 3; // 이만큼 고장이 쌓여야 신뢰할 만한 평균

  // mtbf = 평균 고장 간격 , bttr = 평균 수리 시간 계산
  const hasEnoughData = downCount >= MIN_FAILURES;
  const mtbf = hasEnoughData ? runTimeSec / downCount : null; // 시간단위
  const mttr = hasEnoughData ? downTimeSec / downCount : null;

  // 불량률
  const defectRate =
    metrics.totalCount > 0
      ? (metrics.defectCount / metrics.totalCount) * 100
      : 0;

  // 이 설비의 OEE / 온도 추이 (history 기반)
  const oeeTrend = history.map((tick) => {
    const m = tick.machines.find((x) => x.machineId === id);
    return {
      time: formatTimestamp(tick.timestamp),
      OEE: m ? Number((calculateOee(m.metrics).oee * 100).toFixed(1)) : 0,
    };
  });

  const tempTrend = history.map((tick) => {
    const m = tick.machines.find((x) => x.machineId === id);
    return {
      time: formatTimestamp(tick.timestamp),
      온도: m ? m.temperature : 0,
    };
  });

  // 목표 생산량 = 이론상 최대 × 목표 OEE
  const theoreticalMax =
    metrics.idealCycleTimeSec > 0
      ? metrics.plannedTimeSec / metrics.idealCycleTimeSec
      : 0;
  const targetCount = Math.round(theoreticalMax * targets.oee);

  return (
    <div className="flex flex-col gap-6 px-[8vw] py-8">
      {/* ── 헤더 ── */}
      <div className="flex items-center gap-3 border-b border-gray-700 pb-4">
        <Link to="/" className="text-gray-400 hover:text-white text-xl">
          ←
        </Link>
        <h1 className="text-2xl font-bold">{id}</h1>
        <span
          className={`text-xs px-2 py-1 rounded-full ${STATUS_COLOR[machine.status]}`}
        >
          {STATUS_LABEL[machine.status]}
        </span>
        <span className="ml-auto text-gray-400">
          온도 {machine.temperature}°C
        </span>
      </div>
      {/* ── 생산 실적 ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile label="총 생산" value={metrics.totalCount} unit="ea" />
        <StatTile label="양품" value={metrics.goodCount} unit="ea" />
        <StatTile label="불량" value={metrics.defectCount} unit="ea" />
        <StatTile label="불량률" value={defectRate.toFixed(1)} unit="%" />
      </div>
      {/* ── 차트: OEE 추이 / 온도 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="border border-gray-700 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">OEE 추이</h3>
          <div className="w-full h-250">
            <LineChart
              data={oeeTrend}
              xKey="time"
              series={[{ key: "OEE", name: "OEE", color: "#3b82f6" }]}
              yDomain={[0, 100]}
              legend={false}
              unit="%"
              refLine={targets.oee * 100}
            />
          </div>
        </div>

        <div className="border border-gray-700 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">
            온도 추이
          </h3>
          <div className="w-full h-250">
            <LineChart
              data={tempTrend}
              xKey="time"
              series={[{ key: "온도", color: "#f97316" }]}
              yDomain={[20, 50]}
              legend={false}
              unit="°C"
              refLine={targets.tempWarning}
            />
          </div>
        </div>

        <div className="border border-gray-700 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">
            시간별 생산량
          </h3>
          <span className="text-sm font-semibold text-gray-300 mb-2">
            금일 목표 {targetCount}ea
          </span>
          <div className="w-full h-250">
            <LineChart
              data={tempTrend}
              xKey="time"
              series={[{ key: "온도", color: "#f97316" }]}
              yDomain={[20, 50]}
              legend={false}
              unit="°C"
              refLine={targets.tempWarning}
            />
          </div>
        </div>

        {/* oee 구성 요소 카드 */}
        <div className="flex flex-col p-[2vw] border-s-white border rounded-lg">
          {/* Header */}
          <div className="flex justify-between">
            <div>OEE 구성 요소</div>
            <div
              className={`text-25 ${getLevelTextClass("oee", (oee * 100).toFixed(1))}`}
            >
              {(oee * 100).toFixed(1)}
            </div>
          </div>

          {/*  Body */}
          <div>
            <ProgressBar
              label={"가용성 (Availability)"}
              value={(availability * 100).toFixed(1)}
              metric="availability"
            />
          </div>
          <div>
            <ProgressBar
              label={"성능 (Performance)"}
              value={(performance * 100).toFixed(1)}
              metric="performance"
            />
          </div>
          <div>
            <ProgressBar
              label={"품질 (Quality)"}
              value={(quality * 100).toFixed(1)}
              metric="quality"
            />
          </div>
          {/* footer */}
          <div className="flex">
            <div className="flex flex-col">
              <div>가동 시간</div>
              <div>{formatMinSec(runTimeSec)}</div>
            </div>
            <div className="flex flex-col">
              <div>MTBF</div>
              <div>
                {mtbf == null
                  ? `측정 중 (${downCount}/${MIN_FAILURES})`
                  : formatMinSec(mtbf)}
              </div>
            </div>
            <div className="flex flex-col">
              <div>MTTR</div>
              <div>
                {mttr == null
                  ? `측정 중 (${downCount}/${MIN_FAILURES})`
                  : formatMinSec(mttr)}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* ── 상태 이력 로그 ── */}
      <div className="border border-gray-700 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">상태 이력</h3>
        <div className="flex flex-col gap-1 font-mono text-sm">
          {[...history].reverse().map((tick) => {
            const m = tick.machines.find((x) => x.machineId === id);
            if (!m) return null;
            return (
              <div
                key={tick.timestamp}
                className="flex gap-4 border-b border-gray-800 py-1 text-gray-300"
              >
                <span className="text-gray-500">
                  {formatTimestamp(tick.timestamp)}
                </span>
                <span className={`px-1.5 rounded ${STATUS_COLOR[m.status]}`}>
                  {STATUS_LABEL[m.status]}
                </span>
                <span>생산 {m.metrics.totalCount}</span>
                <span>불량 {m.metrics.defectCount}</span>
                <span className="ml-auto">{m.temperature}°C</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
