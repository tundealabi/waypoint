const MS_PER_DAY = 86_400_000;

export function todayIso(now = new Date()): string {
  return toIsoDate(now);
}

export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseIsoDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

export function addDaysIso(value: string, days: number): string {
  const date = parseIsoDate(value);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

export function isValidDateRange(startDate: string, endDate: string): boolean {
  return Boolean(startDate) && Boolean(endDate) && endDate >= startDate;
}

export function formatDateRange(startDate: string, endDate: string): string {
  const start = parseIsoDate(startDate);
  const end = parseIsoDate(endDate);
  const startYear = start.getFullYear();
  const endYear = end.getFullYear();
  const sameYear = startYear === endYear;
  const sameDay = startDate === endDate;

  const startLabel = start.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: sameYear ? undefined : 'numeric',
  });
  const endLabel = end.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  if (sameDay) {
    return end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  return `${startLabel} – ${endLabel}`;
}

export function countdownLabel(startDate: string, now = new Date()): string | null {
  const start = parseIsoDate(startDate);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round((start.getTime() - today.getTime()) / MS_PER_DAY);
  if (days > 1) {
    return `in ${days} days`;
  }
  if (days === 1) {
    return 'tomorrow';
  }
  if (days === 0) {
    return 'today';
  }
  return null;
}
