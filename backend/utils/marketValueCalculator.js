const POSITION_MULTIPLIERS = {
  ST: 1.2,
  CF: 1.15,
  LW: 1.1,
  RW: 1.1,
  CAM: 1.05,
  CM: 1.0,
  DM: 1.0,
  LWB: 0.95,
  RWB: 0.95,
  CB: 0.9,
  RB: 0.9,
  LB: 0.9,
  GK: 0.85,
};

const roundToNearestThousand = (value) => Math.max(0, Math.round(value / 1000) * 1000);

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function getYearsRemaining(contractExpiry) {
  if (!contractExpiry) return 3;
  const expiry = new Date(contractExpiry);
  if (Number.isNaN(expiry.getTime())) return 3;
  const now = new Date();
  const years = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  return Math.max(0, years);
}

function getContractMultiplier(yearsRemaining) {
  if (yearsRemaining <= 1) return 0.6;
  if (yearsRemaining <= 2) return 0.8;
  if (yearsRemaining <= 5) return 1.0;
  return 1.1;
}

function getAgeMultiplier(age) {
  const ageNum = Number(age);
  if (!Number.isFinite(ageNum)) return 1.0;
  if (ageNum < 25) return Math.exp((ageNum - 25) / 15);
  if (ageNum <= 30) return 1.0;
  return Math.max(0.35, 1 - (ageNum - 30) * 0.07);
}

function getPerformanceModifier(player, statsInput) {
  const stats = Array.isArray(statsInput)
    ? statsInput
    : statsInput
      ? [statsInput]
      : [];

  if (stats.length === 0) return 1.0;

  const recent = stats
    .filter((row) => !row?.isDeleted)
    .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))
    .slice(0, 5);

  if (recent.length === 0) return 1.0;

  let totalMatches = 0;
  let totalGoals = 0;
  let totalAssists = 0;
  let totalMotm = 0;
  let totalCleanSheets = 0;

  for (const row of recent) {
    totalMatches += Number(row.matchesPlayed) || 0;
    totalGoals += Number(row.goals) || 0;
    totalAssists += Number(row.assists) || 0;
    totalMotm += Number(row.manOfTheMatchAwards) || 0;
    totalCleanSheets += Number(row.cleanSheets) || 0;
  }

  if (totalMatches <= 0) return 1.0;

  const attackingImpact = (totalGoals + totalAssists) / totalMatches;
  const motmImpact = totalMotm / totalMatches;
  const defensiveImpact = totalCleanSheets / totalMatches;
  const isDefenseOrGk = ["GK", "CB", "RB", "LB", "LWB", "RWB", "DM"].includes(player?.position);

  const weightedImpact = isDefenseOrGk
    ? defensiveImpact * 0.6 + attackingImpact * 0.25 + motmImpact * 0.15
    : attackingImpact * 0.65 + motmImpact * 0.25 + defensiveImpact * 0.1;

  return clamp(0.92 + weightedImpact * 0.22, 0.9, 1.1);
}

function calculatePlayerMarketValue(player, stats = []) {
  const ovr = clamp(Number(player?.overallRating) || 0, 0, 99);
  const potential = clamp(Number(player?.potentialRating) || ovr, 0, 99);
  const age = Number(player?.age) || 25;
  const positionMultiplier = POSITION_MULTIPLIERS[player?.position] || 1.0;

  let ovrValue = 1200 * Math.pow(1.118, ovr);
  if (ovr >= 90) {
    ovrValue *= Math.pow(1.4, ovr - 89);
  }

  const potentialMultiplier = 1 + Math.max(0, potential - ovr) * 0.015;
  const ageMultiplier = getAgeMultiplier(age);
  const performanceModifier = getPerformanceModifier(player, stats);
  const yearsRemaining = getYearsRemaining(player?.contractExpiry);
  const contractMultiplier = getContractMultiplier(yearsRemaining);

  const normalizedForm = clamp(Number(player?.currentForm), 0, 99);
  const safeForm = Number.isFinite(normalizedForm) ? normalizedForm : 50;
  const formModifier = 1 + ((safeForm - 49.5) / 49.5) * 0.1;

  const baseValueRaw =
    ovrValue * potentialMultiplier * ageMultiplier * positionMultiplier * performanceModifier;
  const finalValueRaw = baseValueRaw * formModifier * contractMultiplier;

  return {
    baseValue: roundToNearestThousand(baseValueRaw),
    formModifier: Number(formModifier.toFixed(4)),
    contractMultiplier: Number(contractMultiplier.toFixed(2)),
    finalValue: roundToNearestThousand(finalValueRaw),
  };
}

module.exports = {
  calculatePlayerMarketValue,
};
