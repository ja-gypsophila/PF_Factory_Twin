import { Link, useParams } from "react-router-dom";
import { useWebSocketContext } from "../context/WebSocketProvider";
import { calculateOee } from "../utils/calculateOee";
import { formatTimestamp } from "../utils/formatTimestamp";
import { STATUS_LABEL, STATUS_COLOR } from "../constants/MACHINE_STATUS";
import LineChart from "../components/charts/LineChart";
import { formatMinSec } from "../utils/formatMinSec";
import ProgressBar from "../components/ProgressBar";
import StatTile from "../components/StatTile";
import { getLevelTextClass, LEVEL_TEXT } from "../theme/levels";
import AreaChart from "../components/charts/AreaChart";
import { TYPE_SENSORS, TYPE_TRENDS } from "../constants/MACHINE_TYPE";
import { AlertTriangleIcon, CheckCircle2 } from "lucide-react";
import { getMachineEvents } from "../constants/MACHINE_EVENTS";

export default function MachineDetail() {
  const { id } = useParams();
  const { data, history } = useWebSocketContext();
  const machine = data?.machines.find((item) => item.machineId === id);
  const sensorConfigs = TYPE_SENSORS[machine?.type] ?? [];
  const trendConfig = TYPE_TRENDS[machine?.type] ?? null;
  const getTrendValue = (m) =>
    m?.sensor?.[trendConfig.key] ?? m?.[trendConfig.key] ?? 0;
  const currentTrendValue = getTrendValue(machine);

  const LEVEL_ICON = {
    ok: CheckCircle2,
    warn: AlertTriangleIcon,
    danger: AlertTriangleIcon,
  };

  // 컴포넌트 안
  const events = getMachineEvents(machine?.type);

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
  const { targets } = machine;

  const MIN_FAILURES = 3; // 이만큼 고장이 쌓여야 신뢰할 만한 평균

  // mtbf = 평균 고장 간격 , bttr = 평균 수리 시간 계산
  const hasEnoughData = downCount >= MIN_FAILURES;
  const mtbf = hasEnoughData ? runTimeSec / downCount : null; // 시간단위
  const mttr = hasEnoughData ? downTimeSec / downCount : null;

  // 이 설비의 OEE / 온도 추이 (history 기반) / 시간별 생산량
  const oeeTrend = history.map((tick) => {
    const m = tick.machines.find((item) => item.machineId === id);
    const value = m
      ? Number((calculateOee(m.metrics).oee * 100).toFixed(1))
      : 0;
    return {
      time: formatTimestamp(tick.timestamp),
      OEE: value,
    };
  });

  const tempTrend = history.map((tick) => {
    const m = tick.machines.find((item) => item.machineId === id);

    return {
      time: formatTimestamp(tick.timestamp),
      [trendConfig.label]: Number(getTrendValue(m).toFixed(1)),
    };
  });

  const chartProduction = (machine.hourProduction ?? []).map((prod) => ({
    time: prod.hour,
    생산: prod.prod,
  }));

  const hoursProduction = [{ key: "생산", color: "#3b82f6" }];

  // 목표 생산량 = 서버가 관리하는 고정 목표 (매 틱 안 변함)
  const targetCount = targets.dailyCount;

  return (
    <div className="flex flex-col gap-6 px-[8vw] py-8">
      {/* ── 헤더 ── */}
      <div className="flex items-center gap-3 border-b border-gray-700 pb-4">
        <Link to="/" className="text-gray-400 hover:text-white text-xl">
          ←
        </Link>
        /
        <h1 className="text-2xl font-bold">
          {id} {machine?.name}
        </h1>
        <span
          className={`text-xs px-2 py-1 rounded-full ${STATUS_COLOR[machine.status]}`}
        >
          {STATUS_LABEL[machine.status]}
        </span>
        {trendConfig && (
          <span className="ml-auto text-gray-400">
            {trendConfig.label} {currentTrendValue.toFixed(1)}
            {trendConfig.unit}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {sensorConfigs.map((s) => (
          <StatTile
            key={s.key}
            label={s.label}
            value={machine.sensor[s.key]?.toFixed(1)}
            unit={s.unit}
          />
        ))}
      </div>

      {/* ── 차트 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* OEE 추이 */}
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
        {/* 온도 추이 */}
        <div className="border border-gray-700 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">
            {trendConfig.label} 추이
          </h3>
          <div className="w-full h-250">
            {trendConfig && (
              <LineChart
                data={tempTrend}
                xKey="time"
                series={[{ key: trendConfig.label, color: "#f97316" }]}
                legend={false}
                unit={trendConfig.unit}
              />
            )}
          </div>
        </div>

        {/* 시간별 생산량  */}
        <div className="border border-gray-700 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">
            시간별 생산량
          </h3>
          <span className="text-sm font-semibold text-gray-300 mb-2">
            금일 목표 {targetCount}ea
          </span>
          <div className="w-full h-250">
            <AreaChart
              data={chartProduction}
              xKey="time"
              series={hoursProduction}
              unit="ea"
              legend={false}
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

        {/* 금일 이벤트 카드 */}
        <div className="border border-gray-700 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">
            금일 이벤트
          </h3>
          <div className="flex flex-col gap-2">
            {events.map((e, i) => {
              const Icon = LEVEL_ICON[e.level];
              return (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className="text-gray-500 font-mono">{e.time}</span>
                  <Icon size={16} className={LEVEL_TEXT[e.level]} />
                  <span
                    className={
                      e.level === "ok" ? "text-gray-500" : "text-gray-200"
                    }
                  >
                    {e.text}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── 상태 이력 로그 ── */}
        {/* <div className="border border-gray-700 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">
            상태 이력
          </h3>
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
        </div> */}
      </div>
    </div>
  );
}
