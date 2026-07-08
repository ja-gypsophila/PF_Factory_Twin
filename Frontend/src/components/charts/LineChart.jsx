import {
  LineChart as ReLineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { Timer } from "lucide-react";

export default function LineChart({
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
      {/* 부모 크기에 맞춤 (부모에 높이 필수!) */}
      <ReLineChart data={data}>
        {/* 차트 본체 + 데이터 주입 */}
        <CartesianGrid vertical={false} strokeDasharray={"3 3"} />{" "}
        {/* 배경 격자 */}
        <XAxis dataKey={xKey} /> {/* 가로축: 데이터의 어떤 필드를 쓸지 */}
        <YAxis domain={yDomain} unit={unit} padding={{ bottom: 12 }} />
        {/* 세로축 */}
        <Tooltip
          cursor={{ stroke: "#334155" }}
          labelFormatter={(label) => (
            <span className="flex items-center gap-5">
              <Timer size={14} />
              {label}
            </span>
          )} // 시각 (x축 값)
          contentStyle={{
            background: "#1e293b", // 다크 배경 (slate-800)
            border: "1px solid #334155",
            borderRadius: 8,
            color: "#f8fafc",
          }}
          labelStyle={{ color: "#94a3b8" }} // 시각 라벨 색 (연회색)
        />
        {/* 마우스 올리면 값 표시 */}
        {legend ? <Legend /> : ""}
        {/* 범례 */}
        {refLine != null && (
          <ReferenceLine
            y={refLine}
            stroke="#f59e0b"
            strokeDasharray={"3 3"}
            strokeWidth={1}
          />
        )}
        {/* 실제 선: 어떤 필드를 그릴지 */}
        {series.map((s) => (
          <Line
            key={s.key}
            type="monotone"
            name={s.name ?? s.key}
            dataKey={s.key}
            stroke={s.color}
            dot={false}
            isAnimationActive={false}
            unit={unit}
          />
        ))}
      </ReLineChart>
    </ResponsiveContainer>
  );
}
