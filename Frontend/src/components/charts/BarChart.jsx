import {
  BarChart as ReBarChart,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
  Bar,
} from "recharts";
import { formatCompact } from "../../utils/formatNumber";

export default function BarChart({ data, xKey, series, yDomain, unit }) {
  return (
    <ResponsiveContainer>
      {/* 부모 크기에 맞춤 (부모에 높이 필수!) */}
      <ReBarChart data={data} barCategoryGap="20%" maxBarSize={48}>
        {/* 차트 본체 + 데이터 주입 */}
        <CartesianGrid /> {/* 배경 격자 */}
        <XAxis dataKey={xKey} /> {/* 가로축: 데이터의 어떤 필드를 쓸지 */}
        <YAxis
          domain={yDomain}
          unit={unit}
          tickFormatter={(v) => formatCompact(v)}
          width={80}
        />{" "}
        {/* 세로축 */}
        <Tooltip /> {/* 마우스 올리면 값 표시 */}
        <Legend /> {/* 범례 */}
        {/* 실제 선: 어떤 필드를 그릴지 */}
        {series.map((s) => (
          <Bar
            key={s.key}
            name={s.name ?? s.key}
            dataKey={s.key}
            isAnimationActive={true}
            fill={s.color}
            radius={[4, 4, 0, 0]}
            unit={unit}
          />
        ))}
      </ReBarChart>
    </ResponsiveContainer>
  );
}
