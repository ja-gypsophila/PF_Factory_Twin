import { calculateOee } from "../../utils/oee";
import { STATUS_COLOR, STATUS_LABEL } from "./../../constants/machineStatus";
import { getGrade } from "./../../utils/grade";

export default function MachineCard({ machine }) {
  const oeePercent = calculateOee(machine.metrics).oee * 100;

  return (
    <div
      key={machine.machineId}
      className="flex flex-col items-center gap-1 border rounded-lg p-4"
    >
      <div className="font-bold">{machine.machineId}</div>
      <span
        className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOR[machine.status]}`}
      >
        {STATUS_LABEL[machine.status]}
      </span>
      <div>
        OEE: {oeePercent.toFixed(1)}% {getGrade(oeePercent)}
      </div>
      <div>온도 : {machine.temperature}°C</div>
    </div>
  );
}
