/**
 * Returns true if the user has the specified role.
 */
export const hasRole = (user, role) => {
  return user?.role === role;
};

/**
 * Convenience helpers to check specific roles.
 */
export const isStudent = (user) => hasRole(user, "STUDENT");
export const isSupervisor = (user) => hasRole(user, "SUPERVISOR");
export const isAdministrator = (user) => hasRole(user, "ADMINISTRATOR");

/**
 * Formats a date into a locale-specific string.
 */
export const formatDate = (date, locale = "en-US", options) => {
  return new Date(date).toLocaleDateString(locale, options);
};

/**
 * Performs a shallow equality check between two objects.
 */
export const shallowEqual = (obj1, obj2) => {
  if (obj1 === obj2) return true;
  if (!obj1 || !obj2) return false;
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  if (keys1.length !== keys2.length) return false;
  for (const key of keys1) {
    if (obj1[key] !== obj2[key]) return false;
  }
  return true;
};

/**
 * Deep clones an object using JSON serialization.
 */
export const deepClone = (value) => {
  return JSON.parse(JSON.stringify(value));
};