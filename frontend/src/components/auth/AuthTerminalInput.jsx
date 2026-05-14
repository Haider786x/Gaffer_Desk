function Glyph({ kind }) {
  const cls = "h-3.5 w-3.5 shrink-0 text-[var(--gd-outline)]";
  if (kind === "id") {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
        <rect x="3" y="5" width="18" height="14" rx="1" />
        <circle cx="9" cy="12" r="1.5" fill="currentColor" stroke="none" />
        <path d="M14 10h4M14 14h3" strokeLinecap="round" />
      </svg>
    );
  }
  if (kind === "key") {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
        <path
          d="M10.5 10.5a3.5 3.5 0 1 1 4.9 4.9L8 20l-2 1-1-2 5.4-5.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="14" cy="10" r="1.25" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  if (kind === "user") {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
        <circle cx="12" cy="8" r="3.25" />
        <path d="M5 20v-1c0-2.5 3-4 7-4s7 1.5 7 4v1" strokeLinecap="round" />
      </svg>
    );
  }
  return null;
}

export function AuthTerminalInput({
  id,
  label,
  glyph,
  name,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
  autoComplete,
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--gd-on-surface-variant)] gd-label-muted"
      >
        {glyph ? <Glyph kind={glyph} /> : null}
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={[
          "gd-auth-input w-full px-3 py-2.5 rounded-sm border bg-[#0e0e10] text-[var(--gd-on-background)] placeholder:text-[var(--gd-outline)]/70",
          "font-[family-name:var(--gd-font-mono)] text-sm tabular-nums transition-colors",
          "focus:outline-none focus:border-[var(--gd-primary)] focus:ring-1 focus:ring-[var(--gd-primary)]/30",
          error
            ? "border-[var(--gd-error)]"
            : "border-[var(--gd-outline-variant)]",
        ].join(" ")}
      />
      {error ? (
        <p className="text-[11px] text-[var(--gd-error)] font-[family-name:var(--gd-font-mono)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
