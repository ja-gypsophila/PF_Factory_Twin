import { useEffect, useRef, useState } from "react";

export function useWebSocket(url) {
  const [data, setData] = useState(null); // 가장 최근에 받은 데이터
  const [status, setStatus] = useState("연결 중"); // WebSocket 연결 상태
  const [history, setHistory] = useState([]); // 받은 데이터를 쌓는 이력 배열
  const socketRef = useRef(null); // WebSocket 인스턴스를 저장할 ref

  useEffect(() => {
    let isUnmounted = false;
    let reconnectTimer = null;

    const connect = () => {
      const socket = new WebSocket(url);
      socketRef.current = socket;

      socket.onopen = () => setStatus("연결됨");
      socket.onclose = () => {
        setStatus("연결 끊김");
        if (!isUnmounted) {
          setStatus("재연결 시도 중");
          reconnectTimer = setTimeout(connect, 3000); // 3초 후 재연결 시도
        }
      };
      socket.onerror = (error) => setStatus(`에러: ${error.message}`);
      socket.onmessage = (e) => {
        const newData = JSON.parse(e.data);
        setData(newData);
        setHistory((prevHistory) => [...prevHistory, newData].slice(-20)); // 새로운 데이터를 이력에 추가
      };
    };

    connect();

    // Cleanup: 컴포넌트가 사라질 때 연결을 끊고 재연결 예약도 취소.
    return () => {
      isUnmounted = true;
      clearTimeout(reconnectTimer);
      socketRef.current?.close();
    };
  }, [url]);

  return { data, status, history };
}
