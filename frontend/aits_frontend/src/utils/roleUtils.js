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

