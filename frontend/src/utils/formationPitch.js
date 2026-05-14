/**
 * Tactical pitch: standard vertical geometry.
 * Y = 0% → opponent goal (top of view). Y = 100% → own goal (bottom).
 * CSS `top` uses the same convention (smaller % = higher on screen).
 */

const POS_ALIASES = {
  CDM: "DM",
  LDM: "DM",
  RDM: "DM",
  LM: "LW",
  RM: "RW",
  LCM: "CM",
  RCM: "CM",
  AMF: "CAM",
  SS: "CF",
  RS: "ST",
  LS: "ST",
};

const CANONICAL_ROLES = new Set([
  "GK",
  "LB",
  "LWB",
  "CB",
  "RB",
  "RWB",
  "DM",
  "CM",
  "CAM",
  "LW",
  "RW",
  "CF",
  "ST",
]);

/** @param {string} raw */
export function normalizePitchPosition(raw) {
  const u = String(raw || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
  if (POS_ALIASES[u]) return POS_ALIASES[u];
  if (CANONICAL_ROLES.has(u)) return u;
  return "CM";
}

/**
 * Strip FIFA/FM-style suffixes: "4-3-3 (4)" → "4-3-3"
 * @param {string} raw
 */
export function normalizeFormationKey(raw) {
  const s = String(raw || "")
    .trim()
    .replace(/\([^)]*\)/g, "")
    .replace(/\s+/g, "");
  return s || "4-3-3";
}

/**
 * Horizontal spread around a center X for N players (collision / duplicate offset).
 * e.g. N=2, center 50, gap 20 → [40, 60]
 * @param {number} centerX
 * @param {number} count
 * @param {number} [minGapBetween=20] px-equivalent in % units
 * @returns {number[]}
 */
export function spreadXAroundCenter(centerX, count, minGapBetween = 20) {
  if (count <= 0) return [];
  if (count === 1) return [clampX(centerX)];
  const span = minGapBetween * (count - 1);
  const start = centerX - span / 2;
  const out = [];
  for (let i = 0; i < count; i += 1) {
    out.push(clampX(start + i * minGapBetween));
  }
  return out;
}

function clampX(x) {
  return Math.min(95, Math.max(5, Math.round(x * 10) / 10));
}

function clampY(y) {
  return Math.min(96, Math.max(4, Math.round(y * 10) / 10));
}


function groupKeyForRole(role) {
  if (role === "ST" || role === "CF") return "TOP_STRIKER";
  if (role === "LB" || role === "LWB") return "LB";
  if (role === "RB" || role === "RWB") return "RB";
  return role;
}

/**
 * Y for this group (all duplicates share same band).
 */
function groupY(group) {
  const y = {
    TOP_STRIKER: 15,
    LW: 25,
    RW: 25,
    CAM: 35,
    CM: 50,
    DM: 65,
    LB: 75,
    RB: 75,
    CB: 80,
    GK: 92,
  };
  return y[group] ?? 50;
}

/**
 * @param {string} group
 * @param {number} count
 * @returns {number[]} x positions in order (stable index order applied outside)
 */
function xsForGroup(group, count) {
  switch (group) {
    case "TOP_STRIKER":
      return spreadXAroundCenter(50, count, 20);
    case "LW":
      return spreadXAroundCenter(20, count, 14);
    case "RW":
      return spreadXAroundCenter(80, count, 14);
    case "CAM":
      return spreadXAroundCenter(50, count, 18);
    case "CM":
      if (count === 1) return [50];
      if (count === 2) return [35, 65].map(clampX);
      return spreadXAroundCenter(50, count, 16);
    case "DM":
      return spreadXAroundCenter(50, count, 18);
    case "LB":
      return spreadXAroundCenter(10, count, 12);
    case "RB":
      return spreadXAroundCenter(90, count, 12);
    case "CB":
      if (count === 1) return [50];
      if (count === 2) return [35, 65].map(clampX);
      return spreadXAroundCenter(50, count, 15);
    case "GK":
      return spreadXAroundCenter(50, count, 10);
    default:
      return spreadXAroundCenter(50, count, 16);
  }
}

function sortKey(pl) {
  const j = Number(pl?.jerseyNumber);
  if (Number.isFinite(j)) return j;
  return String(pl?.name || "");
}

/**
 * @param {object[]} players
 * @param {string} [_formationRaw] unused — placement is role + duplicate geometry only
 * @returns {{ player: object, x: number, y: number }[]}
 */
export function layoutPlayersOnPitch(players, _formationRaw) {
  const list = Array.isArray(players) ? players.filter(Boolean) : [];
  /** @type {Map<string, { player: object, idx: number }[]>} */
  const buckets = new Map();

  list.forEach((pl, idx) => {
    const role = normalizePitchPosition(pl?.position);
    const g = groupKeyForRole(role);
    if (!buckets.has(g)) buckets.set(g, []);
    buckets.get(g).push({ player: pl, idx });
  });

  const placed = [];
  const seenPlayers = new Set();

  const groupOrder = [
    "GK",
    "LB",
    "CB",
    "RB",
    "DM",
    "CM",
    "CAM",
    "LW",
    "RW",
    "TOP_STRIKER",
  ];

  const keys = [...new Set([...groupOrder, ...buckets.keys()])];

  for (const group of keys) {
    const entries = buckets.get(group);
    if (!entries?.length) continue;

    entries.sort((a, b) => {
      const ka = sortKey(a.player);
      const kb = sortKey(b.player);
      if (typeof ka === "number" && typeof kb === "number") return ka - kb;
      return String(ka).localeCompare(String(kb));
    });

    const count = entries.length;
    const xs = xsForGroup(group, count);
    const y = groupY(group);

    entries.forEach((e, i) => {
      seenPlayers.add(e.player);
      placed.push({
        player: e.player,
        x: xs[i] ?? clampX(50),
        y: clampY(y),
      });
    });
  }

  let overflow = 0;
  for (const pl of list) {
    if (seenPlayers.has(pl)) continue;
    overflow += 1;
    placed.push({
      player: pl,
      x: clampX(50 + (overflow % 2 === 0 ? 10 : -10) * Math.ceil(overflow / 2)),
      y: clampY(90 + (overflow % 3)),
    });
    seenPlayers.add(pl);
  }

  return placed;
}

/**
 * Intelligent utility to auto-select the Best 11 players based on formation
 * and overall rating. Maps players strictly to the roles required by the formation.
 * @param {object[]} players
 * @param {string} formationRaw
 * @returns {object[]} array of exactly 11 players with overridden 'position' for pitch layout
 */
export function selectStartingXI(players, formationRaw = "4-3-3") {
  const list = Array.isArray(players) ? players.filter(Boolean) : [];
  if (list.length === 0) return [];

  const formationStr = normalizeFormationKey(formationRaw);
  const requiredRoles = getFormationRoles(formationStr);

  let available = list.filter(p => String(p.status || "Active") === "Active");
  if (available.length < 11 && list.length >= 11) available = list;
  
  // Separate into explicit starters and others
  let explicitStarters = available.filter(p => p.isStarting === true);
  let others = available.filter(p => p.isStarting !== true);

  // Sort by rating to assign best first
  explicitStarters.sort((a, b) => (b.overallRating || 0) - (a.overallRating || 0));
  others.sort((a, b) => (b.overallRating || 0) - (a.overallRating || 0));

  const assignedPlayers = [];
  const usedIds = new Set();
  
  let unassignedRoles = [...requiredRoles];

  const assignToBestRole = (player) => {
    const naturalRole = normalizePitchPosition(player.position);
    
    // 1. Exact match
    let roleIdx = unassignedRoles.indexOf(naturalRole);
    
    // 2. Group match
    if (roleIdx === -1) {
      const isDef = ["LB", "LWB", "CB", "RB", "RWB"].includes(naturalRole);
      const isMid = ["DM", "CM", "CAM", "LW", "RW"].includes(naturalRole);
      const isAtt = ["LW", "RW", "CF", "ST", "CAM"].includes(naturalRole);
      const isGk = naturalRole === "GK";

      roleIdx = unassignedRoles.findIndex(r => {
        if (isGk && r === "GK") return true;
        if (isDef && ["LB", "LWB", "CB", "RB", "RWB"].includes(r)) return true;
        if (isMid && ["DM", "CM", "CAM", "LW", "RW"].includes(r)) return true;
        if (isAtt && ["LW", "RW", "CF", "ST", "CAM"].includes(r)) return true;
        return false;
      });
    }
    
    // 3. Fallback to first available role
    if (roleIdx === -1 && unassignedRoles.length > 0) {
      roleIdx = 0;
    }
    
    if (roleIdx !== -1) {
      const assignedRole = unassignedRoles[roleIdx];
      unassignedRoles.splice(roleIdx, 1);
      assignedPlayers.push({ ...player, position: assignedRole, originalPosition: player.position });
      usedIds.add(player._id || player.id || player.name);
      return true;
    }
    return false;
  };

  // 1. Assign explicit starters
  for (const p of explicitStarters) {
    if (unassignedRoles.length === 0) break;
    assignToBestRole(p);
  }

  // 2. Assign others to remaining roles
  for (const role of [...unassignedRoles]) {
    const isDef = ["LB", "LWB", "CB", "RB", "RWB"].includes(role);
    const isMid = ["DM", "CM", "CAM"].includes(role);
    const isAtt = ["LW", "RW", "CF", "ST"].includes(role);
    const isGk = role === "GK";

    let bestIdx = others.findIndex(p => normalizePitchPosition(p.position) === role);
    if (bestIdx === -1) {
      bestIdx = others.findIndex(p => {
        const r = normalizePitchPosition(p.position);
        if (isGk) return r === "GK";
        if (isDef) return ["LB", "LWB", "CB", "RB", "RWB"].includes(r);
        if (isMid) return ["DM", "CM", "CAM", "LW", "RW"].includes(r);
        if (isAtt) return ["LW", "RW", "CF", "ST", "CAM"].includes(r);
        return false;
      });
    }
    if (bestIdx === -1) {
      bestIdx = 0;
    }

    if (others.length > 0) {
      const p = others[bestIdx];
      others.splice(bestIdx, 1);
      assignedPlayers.push({ ...p, position: role, originalPosition: p.position });
      usedIds.add(p._id || p.id || p.name);
      
      const idx = unassignedRoles.indexOf(role);
      if (idx > -1) unassignedRoles.splice(idx, 1);
    }
  }

  if (assignedPlayers.length < 11) {
    for (const p of others) {
      assignedPlayers.push(p);
      if (assignedPlayers.length === 11) break;
    }
  }

  return assignedPlayers;
}

function getFormationRoles(formationStr) {
  switch (formationStr) {
    case "4-3-3": return ["GK", "LB", "CB", "CB", "RB", "CM", "CM", "CM", "LW", "RW", "ST"];
    case "4-4-2": return ["GK", "LB", "CB", "CB", "RB", "LW", "CM", "CM", "RW", "ST", "ST"];
    case "4-2-3-1": return ["GK", "LB", "CB", "CB", "RB", "DM", "DM", "CAM", "LW", "RW", "ST"];
    case "3-5-2": return ["GK", "CB", "CB", "CB", "LWB", "DM", "CM", "DM", "RWB", "ST", "ST"];
    case "3-4-3": return ["GK", "CB", "CB", "CB", "LM", "CM", "CM", "RM", "LW", "RW", "ST"];
    case "5-3-2": return ["GK", "LWB", "CB", "CB", "CB", "RWB", "CM", "CM", "CM", "ST", "ST"];
    case "4-1-4-1": return ["GK", "LB", "CB", "CB", "RB", "DM", "LW", "CM", "CM", "RW", "ST"];
    case "4-3-2-1": return ["GK", "LB", "CB", "CB", "RB", "CM", "CM", "CM", "CAM", "CAM", "ST"];
    case "5-4-1": return ["GK", "LWB", "CB", "CB", "CB", "RWB", "LW", "CM", "CM", "RW", "ST"];
    default: {
      const parts = formationStr.split("-").map(Number).filter(n => !isNaN(n));
      if (parts.length >= 3) {
        const roles = ["GK"];
        if (parts[0] === 3) roles.push("CB", "CB", "CB");
        else if (parts[0] === 5) roles.push("LWB", "CB", "CB", "CB", "RWB");
        else roles.push("LB", "CB", "CB", "RB");

        const midCount = parts.slice(1, parts.length - 1).reduce((a, b) => a + b, 0);
        for(let i=0; i<midCount; i++) roles.push("CM");

        const attCount = parts[parts.length - 1];
        if (attCount === 1) roles.push("ST");
        else if (attCount === 2) roles.push("ST", "ST");
        else if (attCount === 3) roles.push("LW", "ST", "RW");
        else for(let i=0; i<attCount; i++) roles.push("ST");
        
        while(roles.length < 11) roles.push("CM");
        return roles.slice(0, 11);
      }
      return ["GK", "LB", "CB", "CB", "RB", "CM", "CM", "CM", "LW", "RW", "ST"];
    }
  }
}
