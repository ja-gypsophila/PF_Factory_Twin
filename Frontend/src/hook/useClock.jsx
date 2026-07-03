import { useEffect, useState } from "react";

export function useClock(locale = "ko-KR") {
  const [time, setTime] = useState(() => new Date().toLocaleTimeString(locale));

  useEffect(() => {
    const id = setInterval(
      () => setTime(new Date().toLocaleTimeString(locale)),
      1000,
    );
    return () => clearInterval(id);
  }, []);

  return time;
}
