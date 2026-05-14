// Format date to readable string
export const formatDate = (dateString) => {
  if (!dateString) return "—";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// Format date to ISO format (YYYY-MM-DD)
export const formatDateToISO = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
};

// Calculate age from date of birth
export const calculateAge = (dateOfBirth) => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
};

// Format currency
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(amount);
};

// Format large numbers (e.g., 1000 -> 1K)
export const formatNumber = (num) => {
  if (num === null || num === undefined) return "—";
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
};

// Format percentage
export const formatPercentage = (value, decimals = 1) => {
  if (value === null || value === undefined) return "—";
  return (value * 100).toFixed(decimals) + "%";
};

// Capitalize first letter
export const capitalize = (str) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// Get initials for avatar
export const getInitials = (name) => {
  if (!name) return "?";
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

// Format season display (2023/24)
export const formatSeason = (season) => {
  return season || "—";
};

// Format stats for display
export const formatStats = (stats) => {
  if (!stats && stats !== 0) return "—";
  return stats.toString();
};

// Format rating with color coding
export const getRatingColor = (rating) => {
  const ratingNum = parseInt(rating);
  if (ratingNum >= 88) return "text-green-400";
  if (ratingNum >= 80) return "text-blue-400";
  if (ratingNum >= 70) return "text-yellow-400";
  if (ratingNum >= 60) return "text-orange-400";
  return "text-red-400";
};

// Format rating badge
export const formatRatingBadge = (rating) => {
  if (!rating && rating !== 0) return "—";
  const ratingNum = parseInt(rating);
  return `${ratingNum}`;
};

// Get position color
export const getPositionColor = (position) => {
  const positionColors = {
    GK: "bg-purple-900 text-purple-200",
    RB: "bg-blue-900 text-blue-200",
    LB: "bg-blue-900 text-blue-200",
    CB: "bg-blue-900 text-blue-200",
    RWB: "bg-cyan-900 text-cyan-200",
    LWB: "bg-cyan-900 text-cyan-200",
    DM: "bg-green-900 text-green-200",
    CM: "bg-green-900 text-green-200",
    CAM: "bg-green-900 text-green-200",
    RW: "bg-orange-900 text-orange-200",
    LW: "bg-orange-900 text-orange-200",
    CF: "bg-red-900 text-red-200",
    ST: "bg-red-900 text-red-200",
  };
  return positionColors[position] || "bg-gray-900 text-gray-200";
};

// Truncate text
export const truncate = (text, length = 50) => {
  if (!text) return "";
  if (text.length <= length) return text;
  return text.slice(0, length) + "...";
};

// Format relative time (e.g., "2 hours ago")
export const formatRelativeTime = (dateString) => {
  if (!dateString) return "—";

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return formatDate(dateString);
};
