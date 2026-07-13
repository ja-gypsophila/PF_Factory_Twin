import MachineList from "../components/machine/MachineList";
import LineChart from "../components/charts/LineChart";
import { useWebSocketContext } from "../context/WebSocketProvider";
import KpiCard from "../components/KpiCard";
import { useMemo } from "react";
import { useClock } from "../hook/useClock";
import getFactoryStats from "../utils/getFactoryStats";
import { formatTimestamp } from "../utils/formatTimestamp";
import BarChart from "../components/charts/BarChart";
import AreaChart from "../components/charts/AreaChart";
import Panel from "../components/Panel";
import LoadingScreen from "../components/LoadingScreen";

export default function Dashboard() {
  const { data, status, history } = useWebSocketContext();
  const currentTime = useClock();
  const stats = useMemo(() => getFactoryStats(data?.machines), [data]);

  const chartOEE = useMemo(() => {
    return history.map((tick) => ({
      time: formatTimestamp(tick.timestamp),
      avgOee: getFactoryStats(tick.machines)?.avgOee.toFixed(1) ?? 0,
    }));
  }, [history]);

  const hourProdTrend = (data?.lineHourProduction ?? []).map((h) => ({
    hour: h.hour,
    생산량: h.prod,
  }));

  const dailyProdTrend = (data?.dailyProduction ?? []).map((d) => ({
    day: formatTimestamp(d.date, "date"),
    생산량: d.total,
    불량: d.defect,
  }));

  const machinesOEE = [
    { key: "avgOee", name: "공장 평균 OEE", color: "#3b82f6" },
  ];

  const dailyProd = [
    { key: "생산량", color: "#3b82f6" },
    { key: "불량", color: "red" },
  ];

  const hourProd = [{ key: "생산량", color: "#3b82f6" }];

  if (!stats) return <LoadingScreen message="집계 대기 중" />;

  return (
    <div className="flex flex-col justify-center gap-15">
      {/* Header */}
      <div className="border-b-gray-700 border-b-2">
        <div className="flex justify-between items-center font-semibold">
          <div className="flex divide-x-2 divide-white">
            <div className="px-4">인천 1공장</div>
            <div className="px-4">A라인 • 주간 1조</div>
          </div>
          <div className="flex flex-col p-14 gap-6">
            <span>서버 상태 {status}</span>
            <span>현재 시각 {currentTime}</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col px-[8vw] gap-12">
        <div className="grid grid-cols-2 md:grid-cols-4  justify-between gap-[2vw]">
          <KpiCard
            label={"OEE"}
            current={stats?.avgOee}
            unit={"%"}
            good={true}
            target={stats?.targetOee}
          />

          <KpiCard
            label={"금일 생산"}
            current={stats?.totalCount}
            unit={"ea"}
            good={true}
            target={stats?.targetCount}
            dec={0}
          />

          <KpiCard
            label={"불량률"}
            current={stats?.defectRate}
            unit={"%"}
            good={false}
            target={stats?.targetDefectRate}
          />

          <KpiCard
            label={"설비 가동률"}
            current={stats?.availability}
            unit={"%"}
            good={true}
            target={stats?.targetAvailability}
          />
        </div>
        <MachineList data={data} />
        <Panel
          title={"공장 평균 OEE"}
          accent={"accent"}
          goal={"금일 목표"}
          right={stats?.targetOee}
          unit={"%"}
        >
          <div className="w-full h-300">
            <LineChart
              data={chartOEE}
              xKey={"time"}
              series={machinesOEE}
              yDomain={[0, 100]}
              unit={"%"}
              refLine={stats?.targetOee}
            />
          </div>
        </Panel>

        <Panel
          title={"시간대 생산량"}
          accent={"accent"}
          goal={"금일 목표"}
          right={stats?.targetCount}
          unit={"ea"}
        >
          <div className="w-full h-300">
            <AreaChart
              data={hourProdTrend}
              xKey={"hour"}
              series={hourProd}
              legend={false}
            />
          </div>
        </Panel>

        <Panel title={"일일 생산량"} accent={"accent"}>
          <div className="w-full h-300">
            <BarChart data={dailyProdTrend} xKey={"day"} series={dailyProd} />
          </div>
        </Panel>
      </div>
    </div>
  );
}
