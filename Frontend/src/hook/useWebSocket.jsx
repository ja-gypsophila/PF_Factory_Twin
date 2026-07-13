import { useEffect, useRef, useState } from "react";

export function useWebSocket(url, maxRetries = 5) {
  const [data, setData] = useState(null); // 가장 최근에 받은 데이터
  const [status, setStatus] = useState("연결 중"); // WebSocket 연결 상태
  const [history, setHistory] = useState([]); // 받은 데이터를 쌓는 이력 배열
  const socketRef = useRef(null); // WebSocket 인스턴스를 저장할 ref

  useEffect(() => {
    let isUnmounted = false;
    let reconnectTimer = null;
    let retryCounter = 0;
    const connect = () => {
      const socket = new WebSocket(url);
      socketRef.current = socket;

      socket.onopen = () => {
        setStatus("연결됨");
        retryCounter = 0;
      };
      socket.onclose = () => {
        if (isUnmounted) return;

        // ① 재시도 횟수 초과 → 중단 + 안내 (return 필수!)
        if (retryCounter >= maxRetries) {
          setStatus("네트워크를 확인해주세요");
          return;
        }

        // ② "연결 끊김"은 첫 끊김에만 (재시도 루프 중엔 안 깜빡이게)
        if (retryCounter === 0) setStatus("연결 끊김");

        retryCounter += 1;
        // 지수 백오프: 재시도할수록 간격을 늘려 서버 회복 여유를 준다 (상한 5s)
        const delay = Math.min(300 * 2 ** (retryCounter - 1), 5000);
        reconnectTimer = setTimeout(() => {
          if (isUnmounted) return;
          setStatus(`재연결 시도 중 (${retryCounter}/${maxRetries})`);
          reconnectTimer = setTimeout(connect, delay);
        }, 1000);
      };

      socket.onerror = () => {
        console.warn("WebSocket 오류 발생");
      };
      socket.onmessage = (e) => {
        try {
          const newData = JSON.parse(e.data);
          setData(newData);
          setHistory((prev) => [...prev, newData].slice(-50));
        } catch (err) {
          console.warn("잘못된 메시지 무시:", err); // 앱은 계속 동작
        }
      };
    };

    connect();

    // Cleanup: 컴포넌트가 사라질 때 연결을 끊고 재연결 예약도 취소.
    return () => {
      isUnmounted = true;
      clearTimeout(reconnectTimer);
      socketRef.current?.close();
    };
  }, [url, maxRetries]);

  return { data, status, history };
}
