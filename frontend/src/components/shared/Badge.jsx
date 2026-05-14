const base =
  "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-widest font-bold";

const variants = {
  default: "bg-zinc-900 border-white/10 text-zinc-400",
  success: "bg-zinc-900 border-emerald-500/40 text-emerald-500",
  warning: "bg-zinc-900 border-amber-500/40 text-amber-500",
  danger: "bg-zinc-900 border-red-500/40 text-red-500",
  subtle: "bg-zinc-900 border-white/10 text-zinc-500",
};

export function Badge({ children, tone = "default", className = "" }) {
  const v = variants[tone] || variants.default;
  return <span className={`${base} ${v} ${className}`}>{children}</span>;
}

