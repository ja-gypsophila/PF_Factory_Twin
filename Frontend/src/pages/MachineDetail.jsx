import { Link, useParams } from "react-router-dom";
import { useWebSocketContext } from "../context/WebSocketProvider";
import { calculateOee } from "../utils/calculateOee";
import { formatTimestamp } from "../utils/formatTimestamp";
import { STATUS_LABEL, STATUS_DOT } from "../constants/MACHINE_STATUS";
import LineChart from "../components/charts/LineChart";
import { formatMinSec } from "../utils/formatMinSec";
import ProgressBar from "../components/ProgressBar";
import StatTile from "../components/StatTile";
import Panel from "../components/Panel";
import { getLevel, LEVEL_TEXT } from "../theme/levels";
import AreaChart from "../components/charts/AreaChart";
import { TYPE_SENSORS, TYPE_TRENDS } from "../constants/MACHINE_TYPE";
import { AlertTriangleIcon, CheckCircle2, ArrowLeft } from "lucide-react";
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

  // 병목 설비 기계인지 아닌지 확인 (고정: "INJECTION" 사출기)
  const isBottleNeck = machine.isBottleneck;

  console.log(isBottleNeck);

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
  const oeePercent = oee * 100;
  const oeeLevel = getLevel("oee", oeePercent); // ok | warn | danger

  return (
    <div className="mx-auto flex  flex-col gap-5 px-[6vw] py-8">
      {/* ── 헤더 ── */}
      <div className="flex flex-wrap items-center gap-4 border-b border-hairline pb-5">
        <Link
          to="/"
          className="flex h-9 w-9 items-center justify-center rounded-md border border-hairline text-muted transition-colors hover:border-edge hover:text-ink"
        >
          <ArrowLeft size={16} />
        </Link>

        <div className="flex items-baseline gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            {machine.name}
          </h1>
          <span className="readout text-sm text-faint">{id}</span>
        </div>

        {/* LED 상태 뱃지 */}
        <span className="inline-flex items-center gap-2 rounded-full border border-hairline bg-panel px-3 py-1">
          <span
            className={`inline-block h-2 w-2 rounded-full ${STATUS_DOT[machine.status]}`}
          />
          <span className="hud-label !tracking-[0.12em] text-ink">
            {STATUS_LABEL[machine.status]}
          </span>
        </span>

        {trendConfig && (
          <div className="ml-auto flex items-baseline gap-2">
            <span className="hud-label">{trendConfig.label}</span>
            <span className="readout text-lg font-semibold text-ink">
              {currentTrendValue.toFixed(1)}
              <span className="ml-0.5 text-xs text-faint">
                {trendConfig.unit}
              </span>
            </span>
          </div>
        )}
      </div>

      {/* ── 종류별 센서 리드아웃 ── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {sensorConfigs.map((s) => (
          <StatTile
            key={s.key}
            label={s.label}
            value={machine.sensor[s.key]?.toFixed(1)}
            unit={s.unit}
          />
        ))}
      </div>

      {/* ── 차트/지표 그리드 ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* OEE 추이 */}
        <Panel
          title="OEE 추이"
          accent={oeeLevel}
          goal={"목표"}
          right={(targets.oee * 100).toFixed(0)}
          unit={"%"}
        >
          <div className="h-150 w-full">
            <LineChart
              data={oeeTrend}
              xKey="time"
              series={[{ key: "OEE", name: "OEE", color: "#38e0ff" }]}
              yDomain={[0, 100]}
              legend={false}
              unit="%"
              refLine={targets.oee * 100}
            />
          </div>
        </Panel>

        {/* 종류별 대표 지표 추이 */}
        <Panel title={`${trendConfig?.label ?? "지표"} 추이`} accent="accent">
          <div className="h-150 w-full">
            {trendConfig && (
              <LineChart
                data={tempTrend}
                xKey="time"
                series={[{ key: trendConfig.label, color: "#ffb443" }]}
                legend={false}
                unit={trendConfig.unit}
              />
            )}
          </div>
        </Panel>

        {/* 시간별 생산량 */}
        <Panel
          title="시간별 생산량"
          accent="accent"
          goal={"금일 목표"}
          right={targetCount}
          unit={"ea"}
        >
          <div className="h-150 w-full">
            <AreaChart
              data={chartProduction}
              xKey="time"
              series={hoursProduction}
              legend={false}
            />
          </div>
        </Panel>

        {/* OEE 구성 요소 */}
        <Panel
          title="OEE 구성 요소"
          accent={oeeLevel}
          right={
            <span
              className={`readout text-xl font-bold ${LEVEL_TEXT[oeeLevel]}`}
            >
              {oeePercent.toFixed(1)}
            </span>
          }
          unit={<span className={`${LEVEL_TEXT[oeeLevel]}`}>%</span>}
          bodyClassName="flex flex-col gap-4"
        >
          <ProgressBar
            label="가용성 (Availability)"
            value={(availability * 100).toFixed(1)}
            metric="availability"
          />
          <ProgressBar
            label="성능 (Performance)"
            value={(performance * 100).toFixed(1)}
            metric="performance"
          />
          <ProgressBar
            label="품질 (Quality)"
            value={(quality * 100).toFixed(1)}
            metric="quality"
          />

          {/* 신뢰성 지표 리드아웃 */}
          <div className="mt-1 grid grid-cols-3 gap-2 border-t border-hairline pt-3">
            <div className="flex flex-col gap-1">
              <span className="hud-label">가동 시간</span>
              <span className="readout text-sm text-ink">
                {formatMinSec(runTimeSec)}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="hud-label">MTBF</span>
              <span className="readout text-sm text-ink">
                {mtbf == null
                  ? `측정 중 ${downCount}/${MIN_FAILURES}`
                  : formatMinSec(mtbf)}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="hud-label">MTTR</span>
              <span className="readout text-sm text-ink">
                {mttr == null
                  ? `측정 중 ${downCount}/${MIN_FAILURES}`
                  : formatMinSec(mttr)}
              </span>
            </div>
          </div>
        </Panel>

        {/* 금일 이벤트 (전체 폭) */}
        <Panel title="금일 이벤트" accent="warn" className="lg:col-span-2">
          <div className="flex flex-col divide-y divide-hairline">
            {events.map((e, i) => {
              const Icon = LEVEL_ICON[e.level];
              return (
                <div key={i} className="flex items-center gap-3 py-2 text-sm">
                  <span className="readout text-xs text-faint">{e.time}</span>
                  <Icon size={15} className={LEVEL_TEXT[e.level]} />
                  <span
                    className={e.level === "ok" ? "text-muted" : "text-ink"}
                  >
                    {e.text}
                  </span>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>
    </div>
  );
}
