import MachineCard from "./MachineCard";

export default function MachineList({ data }) {
  return (
    <div>
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-8">
          {data.machines.map((machine) => (
            <MachineCard key={machine.machineId} machine={machine} />
          ))}
        </div>
      )}
    </div>
  );
}
