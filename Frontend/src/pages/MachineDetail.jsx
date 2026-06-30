import { useParams } from "react-router-dom";
import { useWebSocketContext } from "../context/WebSocketProvider";

export default function MachineDetail() {
  const { id } = useParams();
  const { data, history } = useWebSocketContext();
}
