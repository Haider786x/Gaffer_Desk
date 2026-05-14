import { useRef, useState } from "react";
import { ChartTooltip } from "./ChartTooltip.jsx";

export function BarChart({
  width = 420,
  height = 160,
  data,
  xKey,
  yKey,
  color = "#facc15",
  tooltipFormatter,
}) {
  const safeData = Array.isArray(data) ? data : [];

  const [hoverIdx, setHoverIdx] = useState(null);
  const [tooltipXY, setTooltipXY] = useState({ x: 0, y: 0 });
  const svgRef = useRef(null);

  const padding = { top: 12, right: 12, bottom: 28, left: 28 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const ys = safeData.map((d) => Number(d[yKey]) || 0);
  const maxY = Math.max(...ys, 1);
  const calculatedBarW = innerW / Math.max(safeData.length, 1);
  const barW = Math.min(calculatedBarW, 60);
  const totalBarsW = safeData.length * barW;
  const startX = padding.left + (innerW - totalBarsW) / 2;

  const scaleY = (y) => padding.top + innerH - (innerH * (y || 0)) / maxY;

  const bars = safeData.map((d, idx) => {
    const v = Number(d[yKey]) || 0;
    const x = startX + idx * barW + barW * 0.15;
    const y = scaleY(v);
    const h = padding.top + innerH - y;
    return { x, y, h, v, raw: d, idx };
  });

  if (safeData.length === 0) return null;

  const handleMouseMove = (e) => {
    const el = svgRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (!rect.width) return;
    const xSvg = ((e.clientX - rect.left) / rect.width) * width;
    let best = 0;
    let bestDist = Infinity;
    bars.forEach((b) => {
      const d = Math.abs(b.x - xSvg);
      if (d < bestDist) {
        bestDist = d;
        best = b.idx;
      }
    });

    setHoverIdx(best);
    setTooltipXY({ x: e.clientX, y: e.clientY });
  };

  const handleMouseLeave = () => setHoverIdx(null);

  const yTicks = 3;
  const tickVals = Array.from({ length: yTicks + 1 }, (_, i) =>
    Math.round((maxY / yTicks) * i),
  );

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

      {bars.map((b) => {
        const isHover = hoverIdx === b.idx;
        return (
          <g key={b.idx}>
            <rect
              x={b.x}
              y={b.y}
              width={barW * 0.7}
              height={b.h}
              rx={3}
              fill={color}
              opacity={hoverIdx == null || isHover ? 1 : 0.45}
            />
            <text
              x={b.x + barW * 0.35}
              y={padding.top + innerH + 12}
              textAnchor="middle"
              fontSize="8"
              fill="#71717a"
            >
              {b.raw[xKey]}
            </text>
          </g>
        );
      })}

      {tooltipFormatter && hoverIdx != null && (
        <ChartTooltip
          visible={true}
          x={tooltipXY.x}
          y={tooltipXY.y}
        >
          {tooltipFormatter(bars[hoverIdx].raw, bars[hoverIdx - 1]?.raw, hoverIdx)}
        </ChartTooltip>
      )}
    </svg>
  );
}

