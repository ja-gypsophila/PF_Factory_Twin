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
      <ReLineChart
        data={data}
        margin={{ top: 8, right: 8, bottom: 4, left: -8 }}
      >
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
          padding={{ bottom: 12 }}
        />
        <Tooltip
          cursor={CURSOR}
          contentStyle={TOOLTIP_CONTENT}
          labelStyle={TOOLTIP_LABEL}
        />
        {legend && <Legend wrapperStyle={LEGEND_STYLE} />}
        {refLine != null && (
          <ReferenceLine
            y={refLine}
            stroke="#ffb443"
            strokeDasharray="4 4"
            strokeWidth={1}
          />
        )}
        {series.map((s) => (
          <Line
            key={s.key}
            type="monotone"
            name={s.name ?? s.key}
            dataKey={s.key}
            stroke={s.color}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
            unit={unit}
          />
        ))}
      </ReLineChart>
    </ResponsiveContainer>
  );
}
