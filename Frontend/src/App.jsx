import { Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import MachineDetail from "./pages/MachineDetail";
import DataGate from "./components/DataGate";

function App() {
  return (
    <DataGate>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/machine/:id" element={<MachineDetail />} />
      </Routes>
    </DataGate>
  );
}

export default App;
