import { useWebSocketContext } from "../context/WebSocketProvider";
import LoadingScreen from "./LoadingScreen";

export default function DataGate({ children }) {
  const { data, status } = useWebSocketContext();
  if (!data) return <LoadingScreen message={status} />;
  return children;
}
