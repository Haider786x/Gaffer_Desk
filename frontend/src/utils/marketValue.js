export const getMarketValueTier = (value) => {
  const amount = Number(value) || 0;
  if (amount < 5000000) return "Bronze";
  if (amount < 20000000) return "Silver";
  if (amount < 60000000) return "Gold";
  return "Platinum";
};

export const getMarketValueTierClasses = (tier) => {
  if (tier === "Platinum") return "bg-violet-900 text-violet-200";
  if (tier === "Gold") return "bg-yellow-900 text-yellow-200";
  if (tier === "Silver") return "bg-slate-700 text-slate-200";
  return "bg-amber-900 text-amber-200";
};

export const formatMarketValue = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return "—";
  if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(2)}B`;
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${Math.round(amount)}`;
};

export const getGrowthPotentialMeta = (overallRating, potentialRating) => {
  const ovr = Number(overallRating) || 0;
  const potential = Number(potentialRating) || ovr;
  const delta = Math.max(0, potential - ovr);

  if (delta >= 12) return { label: `Elite (+${delta})`, className: "text-emerald-300" };
  if (delta >= 7) return { label: `High (+${delta})`, className: "text-green-300" };
  if (delta >= 3) return { label: `Medium (+${delta})`, className: "text-yellow-300" };
  return { label: `Low (+${delta})`, className: "text-app-text-muted" };
};
