// API — in dev, use same-origin `/api...` via Vite proxy (avoids CORS / CORP issues).
// In production builds, set VITE_API_URL / VITE_AI_API_URL to your deployed bases.
export const API_BASE_URL = import.meta.env.DEV
  ? ""
  : (import.meta.env.VITE_API_URL?.trim() || "http://localhost:3000");

export const AI_API_BASE_URL = import.meta.env.DEV
  ? ""
  : (import.meta.env.VITE_AI_API_URL?.trim() || "http://localhost:5000");

// Storage Keys
export const STORAGE_KEYS = {
  TOKEN: "gafferdesk_token",
  USER: "gafferdesk_user",
};

/** Legacy StatStriker keys — migrated in storage.js */
export const LEGACY_STORAGE_KEYS = {
  TOKEN: "statstriker_token",
  USER: "statstriker_user",
};

// Formation List (from backend teamModel.js)
export const FORMATIONS = [
  // 3 at the Back
  "3-1-4-2",
  "3-4-1-2",
  "3-4-2-1",
  "3-4-3",
  "3-5-2",
  // 4 at the Back
  "4-1-2-1-2",
  "4-1-2-1-2(2)",
  "4-1-3-2",
  "4-1-4-1",
  "4-2-1-3",
  "4-2-2-2",
  "4-2-3-1",
  "4-2-3-1(2)",
  "4-2-4",
  "4-3-1-2",
  "4-3-2-1",
  "4-3-3",
  "4-3-3(2)",
  "4-3-3(3)",
  "4-3-3(4)",
  "4-3-3(5)",
  "4-4-1-1",
  "4-4-1-1(2)",
  "4-4-2",
  "4-4-2(2)",
  "4-5-1",
  "4-5-1(2)",
  // 5 at the Back
  "5-2-1-2",
  "5-2-3",
  "5-3-2",
  "5-4-1",
];

// Formation Groups for easier selection
export const FORMATION_GROUPS = {
  "3 at the Back": ["3-1-4-2", "3-4-1-2", "3-4-2-1", "3-4-3", "3-5-2"],
  "4 at the Back": [
    "4-1-2-1-2",
    "4-1-2-1-2(2)",
    "4-1-3-2",
    "4-1-4-1",
    "4-2-1-3",
    "4-2-2-2",
    "4-2-3-1",
    "4-2-3-1(2)",
    "4-2-4",
    "4-3-1-2",
    "4-3-2-1",
    "4-3-3",
    "4-3-3(2)",
    "4-3-3(3)",
    "4-3-3(4)",
    "4-3-3(5)",
    "4-4-1-1",
    "4-4-1-1(2)",
    "4-4-2",
    "4-4-2(2)",
    "4-5-1",
    "4-5-1(2)",
  ],
  "5 at the Back": ["5-2-1-2", "5-2-3", "5-3-2", "5-4-1"],
};

// Positions
export const POSITIONS = [
  "GK", // Goalkeeper
  "RB", // Right Back
  "LB", // Left Back
  "CB", // Center Back
  "RWB", // Right Wing Back
  "LWB", // Left Wing Back
  "DM", // Defensive Midfielder
  "CM", // Central Midfielder
  "CAM", // Central Attacking Midfielder
  "RW", // Right Winger
  "LW", // Left Winger
  "CF", // Center Forward
  "ST", // Striker
];

// Position Groups for filtering/display
export const POSITION_GROUPS = {
  Goalkeepers: ["GK"],
  Defenders: ["RB", "LB", "CB", "RWB", "LWB"],
  Midfielders: ["DM", "CM", "CAM"],
  Attackers: ["RW", "LW", "CF", "ST"],
};

// Preferred Foot
export const PREFERRED_FEET = ["Left", "Right", "Both"];

// Player Status
export const PLAYER_STATUS = ["Active", "Injured", "Bench", "Loaned"];

// Player Status Colors for UI
export const STATUS_COLORS = {
  Active: "bg-green-900 text-green-200",
  Injured: "bg-red-900 text-red-200",
  Bench: "bg-yellow-900 text-yellow-200",
  Loaned: "bg-blue-900 text-blue-200",
};

// Player Attributes
export const ATTRIBUTES = [
  { key: "pace", label: "Pace" },
  { key: "shooting", label: "Shooting" },
  { key: "passing", label: "Passing" },
  { key: "dribbling", label: "Dribbling" },
  { key: "defense", label: "Defense" },
  { key: "physical", label: "Physical" },
];

// Pagination Defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 50,
};

// Age Range
export const AGE_RANGE = {
  MIN: 16,
  MAX: 45,
};

// Rating Range
export const RATING_RANGE = {
  MIN: 0,
  MAX: 99,
};

// Jersey Number Range
export const JERSEY_RANGE = {
  MIN: 1,
  MAX: 99,
};

// Squad Size
export const SQUAD_SIZE = {
  MAX: 100,
};

// Founded Year Range
export const FOUNDED_YEAR_RANGE = {
  MIN: 1800,
  MAX: new Date().getFullYear(),
};

// Toast Types
export const TOAST_TYPES = {
  SUCCESS: "success",
  ERROR: "error",
  INFO: "info",
  WARNING: "warning",
};

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
};
