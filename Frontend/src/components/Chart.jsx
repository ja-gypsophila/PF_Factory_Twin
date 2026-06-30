import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useMemo } from "react";
import { calculateOee } from "./../utils/oee";
import { LINE_COLORS } from "./../constants/lineColor";

export default function Chart({ data, history }) {
  const formatTime = (timestamp) =>
    new Date(timestamp).toLocaleTimeString("ko-KR", {
      timeZone: "Asia/Seoul",
      hourCycle: "h23",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

  const machineIds = useMemo(
    () => (data?.machines ?? []).map((m) => m.machineId),
    [data],
  );

  const chartData = useMemo(() => {
    return history.map((tick) => {
      const row = { time: formatTime(tick.timestamp) };
      tick.machines.forEach((m) => {
        row[m.machineId] = Number(
          (calculateOee(m.metrics).oee * 100).toFixed(2),
        );
      });
      return row;
    });
  }, [history]);
  return (
    <ResponsiveContainer>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray={"3 3"} />
        <XAxis dataKey="time" />
        <YAxis domain={[0, 100]} />
        <Tooltip />
        <Legend />
        {machineIds.map((machineId, index) => (
          <Line
            key={machineId}
            type="monotone"
            dataKey={machineId}
            stroke={LINE_COLORS[index % LINE_COLORS.length]}
            dot={false}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
