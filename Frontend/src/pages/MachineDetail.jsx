import { useParams } from "react-router-dom";
import { useWebSocketContext } from "../context/WebSocketProvider";

export default function MachineDetail() {
  const { id } = useParams();
  const { data, history } = useWebSocketContext();

  const findMachine = data?.machines.find((m) => m.machineId === id);

  return findMachine ? (
    <div>
      {id}
      <div className="flex flex-col gap-1 font-mono text-sm">
        {history.map((tick) => {
          const m = tick.machines.find((machine) => machine.machineId === id);
          if (!m) return null; // 가드

          return (
            <div key={tick.timestamp} className="flex gap-3 border-b py-1">
              <span className="text-gray-400">
                {new Date(tick.timestamp).toLocaleTimeString("ko-KR")}
              </span>
              <span>{m.status}</span>
              <span>생산 {m.metrics.totalCount}</span>
              <span>양품 {m.metrics.goodCount}</span>
              <span>불량 {m.metrics.defectCount}</span>
              <span>{m.temperature}°C</span>
            </div>
          );
        })}
      </div>
    </div>
  ) : (
    <div>데이터 로딩 중...</div>
  );
}
