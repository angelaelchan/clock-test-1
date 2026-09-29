const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/**
 * `12 mins`, `1 min`, `4 hrs 12 mins`, `1 hr` (SPEC §6.2).
 * `long` spells units out for screen readers: `2 hours`, `30 minutes`.
 */
export function formatDuration(totalMinutes: number, { long = false } = {}): string {
  const total = Math.floor(totalMinutes);
  const h = Math.floor(total / 60);
  const m = total % 60;
  const hrs = (n: number) => (long ? plural(n, 'hour', 'hours') : plural(n, 'hr', 'hrs'));
  const mins = (n: number) => (long ? plural(n, 'minute', 'minutes') : plural(n, 'min', 'mins'));
  if (h === 0) return mins(m);
  return m === 0 ? hrs(h) : `${hrs(h)} ${mins(m)}`;
}

/** `h:mm AM/PM` with no leading zero on the hour. */
export function formatClock(hour24: number, minute: number): string {
  const suffix = hour24 < 12 ? 'AM' : 'PM';
  const h12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${h12}:${String(minute).padStart(2, '0')} ${suffix}`;
}
