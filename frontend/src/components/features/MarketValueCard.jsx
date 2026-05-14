import { formatMarketValue } from "../../utils/marketValue.js";

export function MarketValueCard({ marketValue, tier, breakdown }) {
  const value = marketValue ?? breakdown?.finalValue ?? 0;

  return (
    <div className="bg-app-elevated rounded-lg border border-app-border p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-app-text-muted uppercase tracking-wide">
            Market value
          </p>
          <p className="text-2xl font-semibold text-app-text mt-1">
            {formatMarketValue(value)}
          </p>
        </div>
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-app-elevated-light text-app-text-secondary border border-app-border">
          {tier || "Bronze"}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
        <div className="rounded-md border border-app-border p-3 bg-app-elevated-light">
          <p className="text-app-text-muted text-xs">Base value</p>
          <p className="text-app-text font-medium">
            {formatMarketValue(breakdown?.baseValue)}
          </p>
        </div>
        <div className="rounded-md border border-app-border p-3 bg-app-elevated-light">
          <p className="text-app-text-muted text-xs">Form modifier</p>
          <p className="text-app-text font-medium">{breakdown?.formModifier ?? 1}x</p>
        </div>
        <div className="rounded-md border border-app-border p-3 bg-app-elevated-light">
          <p className="text-app-text-muted text-xs">Contract multiplier</p>
          <p className="text-app-text font-medium">
            {breakdown?.contractMultiplier ?? 1}x
          </p>
        </div>
      </div>
    </div>
  );
}
