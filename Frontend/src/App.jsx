import MachineList from "./components/machine/MachineList";
import Chart from "./components/Chart";
import { useWebSocket } from "./hook/useWebsocket";

function App() {
  const { data, status, history } = useWebSocket("ws://localhost:8080");

  return (
    <div className="flex flex-col justify-center pt-15 gap-15">
      <h2 className="text-center text-2xl font-bold mb-4">
        OEE 실시간 모니터링 {status}
      </h2>
      <div>
        <MachineList data={data} />
      </div>
      <Chart data={data} history={history} />
    </div>
  );
}

export default App;
