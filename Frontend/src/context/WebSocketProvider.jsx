import { createContext, useContext } from "react";
import { useWebSocket } from "../hook/useWebSocket";

const WebSocketContext = createContext(null);

export function WebSocketProvider({ children }) {
  const value = useWebSocket("ws://localhost:8080");
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
