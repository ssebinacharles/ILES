export function asArray(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (data && Array.isArray(data.results)) {
    return data.results;
  }

  if (data && typeof data === "object") {
    return [data];
  }

  return [];
}

export function getStoredUser() {
  try {
    const savedUser = localStorage.getItem("iles_user");

    if (!savedUser) {
      return null;
    }

    return JSON.parse(savedUser);
  } catch {
    return null;
  }
}

export function getCount(data) {
  return asArray(data).length;
}

export function formatDate(value, emptyText = "-") {
  if (!value) {
    return emptyText;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString();
}

export function formatDateTime(value, emptyText = "Not submitted yet") {
  if (!value) {
    return emptyText;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

export function getPlacementIdFromItem(item) {
  if (!item) {
    return null;
  }

  if (item.placement_id) {
    return item.placement_id;
  }

  if (item.placement && typeof item.placement === "object") {
    return item.placement.id || null;
  }

  if (item.placement) {
    return item.placement;
  }

  return null;
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

export function getUserProfileId(user) {
  if (!user) {
    return null;
  }

  return (
    user.profile?.profile_id ||
    user.profile?.id ||
    user.profile_id ||
    user.supervisor_profile_id ||
    user.student_profile_id ||
    null
  );
}

export function isMySupervisorAssignment(assignment, user, expectedRole = "") {
  if (!assignment || !user) {
    return false;
  }

  const supervisor = assignment.supervisor;
  const profileId = getUserProfileId(user);

  const matchesSupervisor =
    supervisor?.id === profileId ||
    supervisor?.user?.id === user.id ||
    supervisor?.user?.username === user.username ||
    supervisor?.user?.email === user.email;

  if (!matchesSupervisor) {
    return false;
  }

  if (!expectedRole) {
    return true;
  }

  return (
    assignment.assignment_role === expectedRole ||
    supervisor?.supervisor_type === expectedRole
  );
}

export function countByStatus(records, field = "status") {
  const counts = {};

  asArray(records).forEach((record) => {
    const value = record?.[field] || "UNKNOWN";
    counts[value] = (counts[value] || 0) + 1;
  });

  return counts;
}

export function averageFinalMark(finalResults) {
  const records = asArray(finalResults);

  if (records.length === 0) {
    return "0.00";
  }

  const total = records.reduce((sum, result) => {
    return sum + Number(result.final_mark || 0);
  }, 0);

  return (total / records.length).toFixed(2);
}

export function displayScore(value, emptyText = "Not available") {
  if (value === null || value === undefined || value === "") {
    return emptyText;
  }

  return `${value}%`;
}

export function getFeedbackCount(log) {
  return asArray(log?.feedback_entries).length;
}

export function getSubmissionTime(log) {
  if (!log) {
    return "Not submitted yet";
  }

  if (log.submitted_at) {
    return formatDateTime(log.submitted_at);
  }

  if (log.status !== "DRAFT" && log.updated_at) {
    return formatDateTime(log.updated_at);
  }

  return "Not submitted yet";
}