export function Card({
  title,
  subtitle,
  actions,
  children,
  className = "",
  padded = true,
}) {
  return (
    <section
      className={`rounded-lg border border-white/5 bg-zinc-900 ${className}`}
    >
      {(title || actions || subtitle) && (
        <header className="px-4 pt-3 pb-2.5 border-b border-white/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            {title && (
              <h2 className="text-sm font-semibold tracking-tight tabular-nums text-zinc-100">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex flex-wrap gap-2 shrink-0">{actions}</div>
          )}
        </header>
      )}
      <div className={padded ? "px-4 py-3.5" : ""}>{children}</div>
    </section>
  );
}

