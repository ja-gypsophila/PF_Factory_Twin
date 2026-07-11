import Panel from "../Panel";
import MachineCard from "./MachineCard";

export default function MachineList({ data }) {
  return (
    <Panel title={"설비 현황"} accent={"accent"}>
      {data && (
        <div className="grid grid-cols-2  md:grid-cols-4 justify-between gap-[2vw] px-8 w-full">
          {data.machines.map((machine) => (
            <MachineCard key={machine.machineId} machine={machine} />
          ))}
        </div>
      )}
    </Panel>
  );
}
