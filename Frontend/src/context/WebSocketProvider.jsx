import { createContext, useContext } from "react";
import { useWebSocket } from "../hook/useWebSocket";

const WebSocketContext = createContext(null);

export function WebSocketProvider({ children }) {
  // 배포 시엔 Vercel 환경변수 VITE_WS_URL(wss://...)을 사용, 로컬은 기본값
  const wsUrl = import.meta.env.VITE_WS_URL ?? "ws://localhost:8080";
  const value = useWebSocket(wsUrl);
  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocketContext() {
  const ctx = useContext(WebSocketContext);
  if (ctx === null) {
    throw new Error(
      "useWebSocketContext must be used within WebSocketProvider",
    );
  }
  return ctx;
}
