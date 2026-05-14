export function SectionHeader({
  eyebrow,
  title,
  description,
  actions,
  align = "between",
  className = "",
}) {
  const layout =
    align === "center"
      ? "items-center justify-center text-center"
      : "items-start justify-between";

  return (
    <div
      className={`flex flex-col lg:flex-row ${layout} gap-4 ${className}`}
    >
      <div className={align === "center" ? "space-y-1" : "space-y-1 min-w-[200px]"}>
        {eyebrow && (
          <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">
            {eyebrow}
          </p>
        )}
        {title && (
          <h1 className="text-2xl sm:text-[1.8rem] leading-tight font-semibold tracking-tight tabular-nums text-zinc-100 truncate">
            {title}
          </h1>
        )}
        {description && (
          <p className="text-sm text-zinc-400 max-w-3xl leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap gap-2 min-w-0 lg:justify-end">{actions}</div>
      )}
    </div>
  );
}

