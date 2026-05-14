export function ChartTooltip({ visible, x, y, children }) {
  if (!visible) return null;

  return (
    <div
      style={{ left: x, top: y }}
      className="fixed z-[60] -translate-x-1/2 -translate-y-2 pointer-events-none"
    >
      <div className="bg-app-elevated-light border border-app-border rounded-lg shadow-lg shadow-black/40 px-3 py-2">
        {children}
      </div>
    </div>
  );
}

