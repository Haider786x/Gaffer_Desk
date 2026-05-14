import { Card } from "../shared/Card.jsx";

function DefaultRail() {
  return (
    <div className="space-y-3">
      <Card title="Operations feed" subtitle="Contextual tactical assistant">
        <ul className="space-y-2 text-xs text-zinc-400">
          <li className="rounded-md border border-white/5 bg-zinc-900 px-3 py-2">
            Keep squad balance between defensive stability and final-third output.
          </li>
          <li className="rounded-md border border-white/5 bg-zinc-900 px-3 py-2">
            Monitor fatigue before high-intensity tactical instructions.
          </li>
          <li className="rounded-md border border-white/5 bg-zinc-900 px-3 py-2">
            Use market/value modules to protect long-term asset upside.
          </li>
        </ul>
      </Card>
      <Card title="Pressure index">
        <div className="space-y-2 text-xs tabular-nums">
          <div className="flex items-center justify-between rounded-md border border-white/5 bg-zinc-900 px-3 py-2">
            <span className="text-zinc-500">League race</span>
            <span className="text-amber-500 font-semibold">Medium</span>
          </div>
          <div className="flex items-center justify-between rounded-md border border-white/5 bg-zinc-900 px-3 py-2">
            <span className="text-zinc-500">Squad morale</span>
            <span className="text-emerald-500 font-semibold">Stable</span>
          </div>
          <div className="flex items-center justify-between rounded-md border border-white/5 bg-zinc-900 px-3 py-2">
            <span className="text-zinc-500">Injury risk</span>
            <span className="text-amber-500 font-semibold">Watchlist</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

export function WorkstationPage({ children, rail = null }) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4">
      <div className="min-w-0 space-y-5">{children}</div>
      <aside className="hidden xl:block xl:sticky xl:top-4 self-start">
        {rail || <DefaultRail />}
      </aside>
    </div>
  );
}

