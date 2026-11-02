const MINUTE = 60;
const HOUR = 3600;
const DAY = 86400;

/** "just now", "5m", "3h", "2d", then a short date — what feeds conventionally show. */
export function timeAgo(iso?: string | null): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));

  if (seconds < 45) return "just now";
  if (seconds < HOUR) return `${Math.max(1, Math.floor(seconds / MINUTE))}m`;
  if (seconds < DAY) return `${Math.floor(seconds / HOUR)}h`;
  if (seconds < DAY * 7) return `${Math.floor(seconds / DAY)}d`;
  return formatDate(iso);
}

export function formatDate(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

export const compactNumber = (n = 0): string => {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0).replace(/\.0$/, "")}K`;
  return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
};

export const pluralize = (n: number, one: string, many = `${one}s`) =>
  `${n} ${n === 1 ? one : many}`;

export const ordinal = (n: number) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
};

/** Username of a populated uploader, or undefined if it is an id string, missing, or the account was deleted (null). */
export const uploaderName = (userId: unknown): string | undefined =>
  userId && typeof userId === "object" ? (userId as { username?: string }).username : undefined;
