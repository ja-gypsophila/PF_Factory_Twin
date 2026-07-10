// ────────────────────────────────────────────────────────────
// Recharts 공용 다크(SCADA) 스타일 토큰
// LineChart / AreaChart / BarChart 가 동일한 축·격자·툴팁 룩을 갖도록
// ────────────────────────────────────────────────────────────

export const GRID_STROKE = "#1a2430";

export const AXIS_TICK = { fill: "#8a99ad", fontSize: 11 };
export const AXIS_LINE = { stroke: "#1e2a38" };

export const CURSOR = { stroke: "#38e0ff", strokeWidth: 1, strokeDasharray: "3 3" };

export const TOOLTIP_CONTENT = {
  background: "rgba(13, 18, 25, 0.95)",
  border: "1px solid #2b3a4d",
  borderRadius: 6,
  color: "#e8eef5",
  fontSize: 12,
  boxShadow: "0 8px 24px -12px rgba(0,0,0,0.8)",
};

export const TOOLTIP_LABEL = {
  color: "#8a99ad",
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  marginBottom: 4,
};

export const LEGEND_STYLE = { fontSize: 12, color: "#8a99ad" };
