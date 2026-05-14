import { useState, useRef } from "react";
import { ChartTooltip } from "./ChartTooltip.jsx";

export function LineChart({
  width = 420,
  height = 180,
  data,
  xKey,
  yKey,
  color = "#22c55e",
  label,
  tooltipFormatter,
}) {
  const safeData = Array.isArray(data) ? data : [];

  const [hoverIdx, setHoverIdx] = useState(null);
  const [tooltipXY, setTooltipXY] = useState({ x: 0, y: 0 });
  const svgRef = useRef(null);

  const padding = { top: 16, right: 12, bottom: 24, left: 28 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const xs = safeData.map((d, i) =>
    typeof d[xKey] === "number" ? d[xKey] : i,
  );
  const ys = safeData.map((d) => Number(d[yKey]) || 0);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = 0;
  const maxY = Math.max(...ys, 1);

  const isSinglePoint = maxX === minX;

  const scaleX = (x) => {
    if (isSinglePoint) return padding.left + innerW / 2;
    return padding.left + (innerW * (x - minX)) / (maxX - minX);
  };
  const scaleY = (y) =>
    padding.top + innerH - (innerH * (y - minY || 0)) / (maxY - minY || 1);

  const points = safeData.map((d, i) => {
    const xRaw = typeof d[xKey] === "number" ? d[xKey] : i;
    const yRaw = Number(d[yKey]) || 0;
    return {
      x: scaleX(xRaw),
      y: scaleY(yRaw),
      raw: d,
    };
  });

  if (safeData.length === 0) return null;

  const pathD = points
    .map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const yTicks = 4;
  const tickVals = Array.from({ length: yTicks + 1 }, (_, i) =>
    Math.round((maxY / yTicks) * i),
  );

  const handleMouseMove = (e) => {
    if (!points?.length) return;
    const el = svgRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (!rect.width) return;
    const xSvg = ((e.clientX - rect.left) / rect.width) * width;
    let best = 0;
    let bestDist = Infinity;
    points.forEach((p, idx) => {
      const d = Math.abs(p.x - xSvg);
      if (d < bestDist) {
        bestDist = d;
        best = idx;
      }
    });

    const idx = best;
    if (idx == null) return;
    setHoverIdx(idx);
    setTooltipXY({ x: e.clientX, y: e.clientY });
  };

  const handleMouseLeave = () => setHoverIdx(null);

  return (
    <svg
      ref={svgRef}
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible select-none"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <defs>
        <linearGradient id="lineChartFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.24" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* grid */}
      {tickVals.map((v, i) => {
        const y = scaleY(v);
        return (
          <g key={i}>
            <line
              x1={padding.left}
              y1={y}
              x2={width - padding.right}
              y2={y}
              stroke="#27272f"
              strokeWidth="1"
              strokeDasharray="2 4"
            />
            <text
              x={padding.left - 4}
              y={y + 3}
              textAnchor="end"
              fontSize="8"
              fill="#71717a"
            >
              {v}
            </text>
          </g>
        );
      })}

      {/* area under line */}
      <path
        d={`${pathD} L ${points[points.length - 1].x} ${padding.top + innerH} L ${
          points[0].x
        } ${padding.top + innerH} Z`}
        fill="url(#lineChartFill)"
      />

      {/* line */}
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* points */}
      {points.map((p, idx) => (
        <g key={idx}>
          <circle
            cx={p.x}
            cy={p.y}
            r={3}
            fill={color}
            stroke="#020617"
            strokeWidth="1"
            opacity={hoverIdx == null || hoverIdx === idx ? 1 : 0.45}
          />
        </g>
      ))}

      {label && (
        <text
          x={padding.left}
          y={padding.top - 4}
          fontSize="10"
          fill="#a1a1aa"
        >
          {label}
        </text>
      )}

      {tooltipFormatter && hoverIdx != null && (
        <ChartTooltip
          visible={true}
          x={tooltipXY.x}
          y={tooltipXY.y}
        >
          {tooltipFormatter(points[hoverIdx].raw, points[hoverIdx - 1]?.raw, hoverIdx)}
        </ChartTooltip>
      )}
    </svg>
  );
}

