import MachineList from "../components/machine/MachineList";
import LineChart from "../components/charts/LineChart";
import { useWebSocketContext } from "../context/WebSocketProvider";
import KpiCard from "../components/KpiCard";
import { useMemo } from "react";
import { calculateOee } from "../utils/calculateOee";
import { useClock } from "../hook/useClock";
import getFactoryStats from "../utils/getFactoryStats";

export default function Dashboard() {
  const { data, status, history } = useWebSocketContext();
  const currentTime = useClock();
  const machineIds = useMemo(
    () => (data?.machines ?? []).map((m) => m.machineId),
    [data],
  );

  const stats = useMemo(() => getFactoryStats(data?.machines), [data]);

  const formatTime = (timestamp) =>
    new Date(timestamp).toLocaleTimeString("ko-KR", {
      timeZone: "Asia/Seoul",
      hourCycle: "h23",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

  const chartData = useMemo(() => {
    return history.map((tick) => {
      const row = { time: formatTime(tick.timestamp) };
      tick.machines.forEach((m) => {
        row[m.machineId] = Number(
          (calculateOee(m.metrics).oee * 100).toFixed(2),
        );
      });
      return row;
    });
  }, [history]);

  return (
    <div className="flex flex-col justify-center gap-15">
      {/* Header */}
      <div className="border-b-gray-700 border-b-2">
        <div className="flex justify-between">
          <div className="flex p-14 gap-6">
            <div>인천 1공장</div>
            <div className="border-l-gray-700 border-2"></div>
            <div className="">A라인 • 주간 1조</div>
          </div>
          <div>
            <span>서버 상태 {status}</span>
            <span>현재 시각 {currentTime}</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col px-[8vw]">
        <div className="flex justify-between gap-[2vw]">
          <KpiCard
            label={"OEE"}
            current={33}
            unit={"%"}
            target={"85"}
            good={false}
          />

          <KpiCard
            label={"총 생산량"}
            current={22}
            unit={"ea"}
            target={"85"}
            good={false}
          />

          <KpiCard
            label={"OEE"}
            current={"87.3"}
            unit={"%"}
            target={"85"}
            good={false}
          />

          <KpiCard
            label={"OEE"}
            current={"87.3"}
            unit={"%"}
            target={"85"}
            good={false}
          />
        </div>
        <MachineList data={data} />
        <div className="w-full h-300">{/* <LineChart /> */}</div>
      </div>
    </div>
  );
}
