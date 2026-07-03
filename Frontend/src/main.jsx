import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { WebSocketProvider } from "./context/WebSocketProvider.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <WebSocketProvider>
        <App />
      </WebSocketProvider>
    </BrowserRouter>
  </StrictMode>,
);
