import { calculateOee } from "../../utils/calculateOee";
import { Link } from "react-router-dom";
import ProgressBar from "../ProgressBar";
import StatusIcon from "../StatusIcon";
import {
  STATUS_CARD_COLOR,
  STATUS_LABEL,
} from "../../constants/MACHINE_STATUS";

export default function MachineCard({ machine }) {
  const { availability, oee } = calculateOee(machine.metrics);
  const oeePercent = oee * 100;
  const availabilityPercent = availability * 100;

  return (
    <Link className="w-full" to={`/machine/${machine.machineId}`}>
      <div
        key={machine.machineId}
        className="w-full hover:bg-raised/60 flex flex-col gap-1 border rounded-lg p-16"
      >
        <div className="font-bold">
          <div className="flex justify-between">
            <span>{machine.machineId}</span>
            <div className="flex">
              <StatusIcon status={machine.status} />
              <span
                className={`text-sm px-10 py-2 rounded-full ${STATUS_CARD_COLOR[machine.status]}`}
              >
                {STATUS_LABEL[machine.status]}
              </span>
            </div>
          </div>
          <span>{machine.name}</span>
        </div>

        <ProgressBar label="가용성" value={availabilityPercent}></ProgressBar>
        <ProgressBar label="OEE" value={oeePercent.toFixed(1)}></ProgressBar>
      </div>
    </Link>
  );
}
