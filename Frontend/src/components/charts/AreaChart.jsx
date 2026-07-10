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
import {
  GRID_STROKE,
  AXIS_TICK,
  AXIS_LINE,
  CURSOR,
  TOOLTIP_CONTENT,
  TOOLTIP_LABEL,
  LEGEND_STYLE,
} from "../../theme/chartTheme";
import { formatCompact } from "../../utils/formatNumber";

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
      <ReAreaChart
        data={data}
        margin={{ top: 8, right: 8, bottom: 4, left: -8 }}
      >
        {/* 그라데이션 정의 (series마다 하나씩) */}
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
              <stop offset="0%" stopColor={s.color} stopOpacity={0.45} />
              <stop offset="100%" stopColor={s.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>

        <CartesianGrid
          vertical={false}
          stroke={GRID_STROKE}
          strokeDasharray="3 3"
        />
        <XAxis
          dataKey={xKey}
          tick={AXIS_TICK}
          axisLine={AXIS_LINE}
          tickLine={false}
          minTickGap={24}
        />
        <YAxis
          domain={yDomain}
          unit={unit}
          tick={AXIS_TICK}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => formatCompact(v)}
          width={44}
        />
        <Tooltip
          cursor={CURSOR}
          contentStyle={TOOLTIP_CONTENT}
          labelStyle={TOOLTIP_LABEL}
        />
        {legend && <Legend wrapperStyle={LEGEND_STYLE} />}
        {refLine != null && (
          <ReferenceLine y={refLine} stroke="#ffb443" strokeDasharray="4 4" />
        )}

        {/* Area = 선 + 그라데이션 채우기 */}
        {series.map((s) => (
          <Area
            key={s.key}
            type="monotone"
            name={s.name ?? s.key}
            dataKey={s.key}
            stroke={s.color}
            strokeWidth={2}
            fill={`url(#grad-${s.key})`}
            dot={false}
            isAnimationActive={false}
          />
        ))}
      </ReAreaChart>
    </ResponsiveContainer>
  );
}
