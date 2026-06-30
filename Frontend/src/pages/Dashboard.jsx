import MachineList from "../components/machine/MachineList";
import Chart from "../components/Chart";
import { useWebSocketContext } from "../context/WebSocketProvider";

export default function Dashboard() {
  const { data, status, history } = useWebSocketContext();
  return (
    <div className="flex flex-col justify-center pt-15 gap-15">
      <h2 className="text-center text-2xl font-bold mb-4">
        OEE 실시간 모니터링 {status}
      </h2>
      <MachineList data={data} />
      <div className="w-full h-300">
        <Chart data={data} history={history} />
      </div>
    </div>
  );
}
