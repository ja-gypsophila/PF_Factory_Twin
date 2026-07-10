import {
  AreaChart as ReAreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";

export default function AreaChart({
  data,
  xKey,
  series,
  yDomain,
  unit,
  refLine,
  legend = true,
}) {
  return (
    <ResponsiveContainer>
      <ReAreaChart data={data}>
        {/* 1. 그라데이션 정의 (series마다 하나씩) */}
        <defs>
          {series.map((s) => (
            <linearGradient
              key={s.key}
              id={`grad-${s.key}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="5%" stopColor={s.color} stopOpacity={0.4} />
              <stop offset="95%" stopColor={s.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>

        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey={xKey} />
        <YAxis domain={yDomain} unit={unit} />
        <Tooltip />
        {legend && <Legend />}
        {refLine != null && (
          <ReferenceLine y={refLine} stroke="#f59e0b" strokeDasharray="3 3" />
        )}

        {/* 2+3. Area = 선 + 그라데이션 채우기 */}
        {series.map((s) => (
          <Area
            key={s.key}
            type="monotone"
            name={s.name ?? s.key}
            dataKey={s.key}
            stroke={s.color} // 선 색
            strokeWidth={2}
            fill={`url(#grad-${s.key})`} // ← 아래 채우기에 그라데이션
            dot={false}
            isAnimationActive={false}
          />
        ))}
      </ReAreaChart>
    </ResponsiveContainer>
  );
}
