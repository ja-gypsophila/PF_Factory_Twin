import { useWebSocketContext } from "../context/WebSocketProvider";
import LoadingScreen from "./LoadingScreen";

export default function DataGate({ children }) {
  const { data } = useWebSocketContext();
  if (!data) return <LoadingScreen message="서버 연결 중" />;
  return children;
}
