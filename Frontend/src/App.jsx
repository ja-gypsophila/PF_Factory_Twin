import { Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import MachineDetail from "./pages/MachineDetail";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/machine/:id" element={<MachineDetail />} />
    </Routes>
  );
}

export default App;
