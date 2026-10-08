export function formatMoney(amount: string | number, currency = "INR") {
  const value = typeof amount === "string" ? Number(amount) : amount;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(
    new Date(date),
  );
}

export function formatDateTime(date: string | Date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

const ACTIVITY_VERB: Record<string, string> = {
  CREATE: "created",
  UPDATE: "updated",
  DELETE: "deleted",
  ARCHIVE: "archived",
  APPROVE: "approved",
  SETTLE: "settled",
  REMOVE: "removed",
  SUSPEND: "suspended",
  INVITE: "created an invitation for",
  ROLE_CHANGE: "changed the role of",
};

// Actions that read as a complete phrase without naming the entity.
const ACTIVITY_PHRASE: Record<string, string> = {
  JOIN: "joined the room",
  LEAVE: "left the room",
  LOGIN: "logged in",
  LOGOUT: "logged out",
};

const ENTITY_NAME: Record<string, string> = {
  RoomMembership: "member",
  BudgetMemberPayment: "budget contribution",
  GoalContribution: "goal contribution",
  RecurringExpense: "recurring expense",
};

export function describeActivity(action: string, entityType: string) {
  if (ACTIVITY_PHRASE[action]) return ACTIVITY_PHRASE[action];
  const verb = ACTIVITY_VERB[action] ?? action.toLowerCase().replace(/_/g, " ");
  const entity = ENTITY_NAME[entityType] ?? entityType.replace(/([A-Z])/g, " $1").trim().toLowerCase();
  return `${verb} ${/^[aeiou]/.test(entity) ? "an" : "a"} ${entity}`;
}

export function relativeTime(date: string | Date) {
  const diffMs = Date.now() - new Date(date).getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDay = Math.round(diffHour / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return formatDate(date);
}
