import {
  LineChart as ReLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function LineChart({ data, xKey, series, yDomain, unit }) {
  return (
    <ResponsiveContainer>
      <ReLineChart data={data}>
        <XAxis dataKey={xKey} />
        <YAxis domain={yDomain} unit={unit} />
        <Tooltip />
        <Legend />
        {series.map((s) => (
          <Line
            key={s.key}
            type="monotone"
            name={s.name ?? s.key}
            dataKey={s.key}
            stroke={s.color}
            dot={false}
            isAnimationActive={false}
          />
        ))}
      </ReLineChart>
    </ResponsiveContainer>
  );
}
