export function DataTable({ headers, rows, className = "", dense = false }) {
  const cellPadding = dense ? "px-3 py-2" : "px-4 py-3";

  return (
    <div
      className={`overflow-x-auto rounded-xl border border-app-border bg-app-elevated shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] ${className}`}
    >
      <table className="w-full min-w-full text-sm tabular-nums">
        {headers && (
          <thead className="bg-app-elevated-light/70 border-b border-app-border sticky top-0 z-10 backdrop-blur-sm">
            <tr>
              {headers.map((h) => (
                <th
                  key={h.key || h.label || h}
                  className={`${cellPadding} text-left text-[11px] font-semibold tracking-[0.08em] uppercase text-app-text-secondary`}
                >
                  {h.label || h}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {rows}
        </tbody>
      </table>
    </div>
  );
}

