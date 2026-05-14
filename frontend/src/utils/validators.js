// Password validation rules
export const PASSWORD_RULES = {
  MIN_LENGTH: 8,
  UPPERCASE: /[A-Z]/,
  LOWERCASE: /[a-z]/,
  DIGIT: /\d/,
  SPECIAL: /[@$!%*?&]/,
};

export const validatePassword = (password) => {
  const errors = [];

  if (password.length < PASSWORD_RULES.MIN_LENGTH) {
    errors.push(
      `Password must be at least ${PASSWORD_RULES.MIN_LENGTH} characters`,
    );
  }
  if (!PASSWORD_RULES.UPPERCASE.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  if (!PASSWORD_RULES.LOWERCASE.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  if (!PASSWORD_RULES.DIGIT.test(password)) {
    errors.push("Password must contain at least one digit");
  }
  if (!PASSWORD_RULES.SPECIAL.test(password)) {
    errors.push(
      "Password must contain at least one special character (@$!%*?&)",
    );
  }

  return errors;
};

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateUsername = (username) => {
  const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
  return usernameRegex.test(username);
};

export const validateTeamName = (name) => {
  return name.trim().length >= 2 && name.trim().length <= 100;
};

export const validatePlayerName = (name) => {
  return name.trim().length >= 2 && name.trim().length <= 100;
};

export const validateAge = (age) => {
  const ageNum = parseInt(age);
  return ageNum >= 16 && ageNum <= 45;
};

export const validateRating = (rating) => {
  const ratingNum = parseInt(rating);
  return ratingNum >= 0 && ratingNum <= 99;
};

export const validatePotentialRating = (overall, potential) => {
  const overallNum = parseInt(overall);
  const potentialNum = parseInt(potential);
  return potentialNum >= overallNum;
};

export const validateJerseyNumber = (number) => {
  if (!number) return true; // Optional field
  const jerseyNum = parseInt(number);
  return jerseyNum >= 1 && jerseyNum <= 99;
};

export const validateDateOfBirth = (dateString) => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return false;

  const today = new Date();
  const age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();

  let actualAge = age;
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    actualAge = age - 1;
  }

  return actualAge >= 16 && actualAge <= 45;
};

export const validateSeason = (season) => {
  const seasonRegex = /^\d{4}\/\d{2}$/;
  if (!seasonRegex.test(season)) return false;

  const [year, month] = season.split("/").map(Number);
  const currentYear = new Date().getFullYear();

  return year >= 2000 && year <= currentYear + 1 && month >= 0 && month <= 99;
};

export const validateCountryCity = (value) => {
  return value.trim().length >= 2 && value.trim().length <= 100;
};

export const validateDescription = (description) => {
  if (!description) return true; // Optional
  return description.trim().length <= 1000;
};

export const validateBudget = (budget) => {
  if (!budget) return true; // Optional
  const budgetNum = parseInt(budget);
  return budgetNum >= 0;
};

export const validateLeague = (league) => {
  if (!league) return true; // Optional
  return league.trim().length <= 100;
};

export const validateFoundedYear = (year) => {
  if (!year) return true; // Optional
  const yearNum = parseInt(year);
  const currentYear = new Date().getFullYear();
  return yearNum >= 1800 && yearNum <= currentYear;
};
