export function asArray(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  return [];
}

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("iles_user"));
  } catch {
    return null;
  }
}

export function getCount(data) {
  return asArray(data).length;
}

export function formatDate(value) {
  if (!value) return "-";

  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return value;
  }
}

export function formatDateTime(value) {
  if (!value) return "Not submitted yet";

  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export function getPlacementIdFromItem(item) {
  if (!item) return null;

  if (item.placement && typeof item.placement === "object") {
    return item.placement.id;
  }

  return item.placement || null;
}

export function uniqueById(records) {
  const map = new Map();

  asArray(records).forEach((record) => {
    if (record && record.id !== undefined && record.id !== null) {
      map.set(record.id, record);
    }
  });

  return Array.from(map.values());
}

export function isMySupervisorAssignment(assignment, user, expectedRole = "") {
  if (!assignment || !user) return false;

  const supervisor = assignment.supervisor;
  const profileId = user.profile?.profile_id;

  const matchesSupervisor =
    supervisor?.id === profileId ||
    supervisor?.user?.id === user.id ||
    supervisor?.user?.username === user.username;

  if (!matchesSupervisor) return false;

  if (!expectedRole) return true;

  return assignment.assignment_role === expectedRole;
}

export function countByStatus(records, field = "status") {
  const counts = {};

  asArray(records).forEach((record) => {
    const value = record[field] || "UNKNOWN";
    counts[value] = (counts[value] || 0) + 1;
  });

  return counts;
}

export function averageFinalMark(finalResults) {
  const records = asArray(finalResults);

  if (records.length === 0) return "0.00";

  const total = records.reduce((sum, result) => {
    return sum + Number(result.final_mark || 0);
  }, 0);

  return (total / records.length).toFixed(2);
}