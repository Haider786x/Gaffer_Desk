const fs = require("fs");
const path = require("path");
const { parseCsv } = require("./csvParser");

const DEFAULT_CSV_PATH = path.join(__dirname, "..", "assets", "EAFC26-Men.csv");

let cachedPlayers = null;
let cachedAt = null;

function getCsvPath() {
  return process.env.REAL_PLAYERS_CSV_PATH || DEFAULT_CSV_PATH;
}

function toInt(v) {
  const n = parseInt(String(v ?? "").trim(), 10);
  return Number.isFinite(n) ? n : null;
}

function getDateOfBirthFromAge(age) {
  // Validator checks derived age based on month/day; using Jan 1 makes it stable.
  const ageNum = parseInt(age, 10);
  if (!Number.isFinite(ageNum)) return null;
  const year = new Date().getFullYear() - ageNum;
  return new Date(year, 0, 1).toISOString().slice(0, 10);
}

function mapPosition(posRaw) {
  const pos = String(posRaw ?? "").trim().toUpperCase();
  if (!pos) return null;
  if (pos === "RM") return "RW";
  if (pos === "LM") return "LW";
  if (pos === "CDM") return "DM";
  // Some exports already match app positions: GK/RB/LB/CB/DM/CM/CAM/RW/LW/CF/ST/RWB/LWB
  if (
    [
      "GK",
      "RB",
      "LB",
      "CB",
      "RWB",
      "LWB",
      "DM",
      "CM",
      "CAM",
      "RW",
      "LW",
      "CF",
      "ST",
    ].includes(pos)
  ) {
    return pos;
  }
  // Fallback: treat unknown as ST so player creation still works.
  return "ST";
}

function mapPreferredFoot(raw) {
  const v = String(raw ?? "").trim().toLowerCase();
  if (v === "left") return "Left";
  if (v === "right") return "Right";
  if (v === "both") return "Both";
  return null;
}

function derivePotential(overallRating) {
  const o = toInt(overallRating);
  if (o == null) return null;
  const p = Math.min(99, o + 2);
  return p;
}

function loadRealPlayersIfNeeded() {
  if (cachedPlayers) return cachedPlayers;

  const csvPath = getCsvPath();
  if (!fs.existsSync(csvPath)) {
    throw new Error(`Real player database CSV not found at: ${csvPath}. Please add it or configure REAL_PLAYERS_CSV_PATH.`);
  }

  const content = fs.readFileSync(csvPath, "utf8");
  const parsed = parseCsv(content);
  if (!parsed || parsed.length < 2) {
    cachedPlayers = [];
    cachedAt = new Date();
    return cachedPlayers;
  }

  const header = parsed[0];
  const idx = {};
  header.forEach((h, i) => {
    idx[h] = i;
  });

  const need = [
    "ID",
    "Name",
    "OVR",
    "PAC",
    "SHO",
    "PAS",
    "DRI",
    "DEF",
    "PHY",
    "Position",
    "Preferred foot",
    "Age",
    "Nation",
  ];

  const missing = need.filter((k) => idx[k] == null);
  if (missing.length) {
    cachedPlayers = [];
    cachedAt = new Date();
    return cachedPlayers;
  }

  const currentYear = new Date().getFullYear();
  const mapped = [];

  for (let r = 1; r < parsed.length; r += 1) {
    const row = parsed[r];
    if (!row || row.length === 0) continue;

    const id = toInt(row[idx["ID"]]);
    const name = String(row[idx["Name"]] ?? "").trim();
    if (!name || id == null) continue;

    const overallRating = toInt(row[idx["OVR"]]);
    const age = toInt(row[idx["Age"]]);
    const position = mapPosition(row[idx["Position"]]);
    const nationality = String(row[idx["Nation"]] ?? "").trim();

    if (overallRating == null || age == null || !position || !nationality)
      continue;

    const dateOfBirth = getDateOfBirthFromAge(age);
    const preferredFoot = mapPreferredFoot(row[idx["Preferred foot"]]);

    const pace = toInt(row[idx["PAC"]]);
    const shooting = toInt(row[idx["SHO"]]);
    const passing = toInt(row[idx["PAS"]]);
    const dribbling = toInt(row[idx["DRI"]]);
    const defense = toInt(row[idx["DEF"]]);
    const physical = toInt(row[idx["PHY"]]);

    const potentialRating = derivePotential(overallRating);

    // If DB data is missing (shouldn't happen), skip.
    if (!dateOfBirth || preferredFoot == null) continue;

    mapped.push({
      realId: id,
      name,
      age,
      position,
      nationality,
      dateOfBirth,
      preferredFoot,
      overallRating,
      potentialRating,
      pace: pace ?? 0,
      shooting: shooting ?? 0,
      passing: passing ?? 0,
      dribbling: dribbling ?? 0,
      defense: defense ?? 0,
      physical: physical ?? 0,
      // Used for search UI
      currentYear,
    });
  }

  cachedPlayers = mapped;
  cachedAt = new Date();
  return cachedPlayers;
}

function searchRealPlayers({ query = "", limit = 10 }) {
  const players = loadRealPlayersIfNeeded();
  const q = String(query).trim().toLowerCase();
  if (!q) return players.slice(0, limit);

  const scored = [];
  for (const p of players) {
    const name = p.name.toLowerCase();
    const nat = p.nationality.toLowerCase();
    const pos = p.position.toLowerCase();
    const idx = name.indexOf(q);
    if (idx >= 0) scored.push({ p, score: idx });
    else if (nat.includes(q) || pos.includes(q)) scored.push({ p, score: 9999 });
  }

  scored.sort((a, b) => a.score - b.score || b.p.overallRating - a.p.overallRating);
  return scored.slice(0, limit).map((s) => s.p);
}

module.exports = {
  searchRealPlayers,
  loadRealPlayersIfNeeded,
};

