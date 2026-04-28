// Slots are stored as 24-hour "HH:mm" on the wire/DB. The UI is 12-hour AM/PM.

export interface Time12 {
  hour12: number; // 1-12
  minute: number; // 0-59
  period: 'AM' | 'PM';
}

export function format12h(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm;
  const period: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
  const hour12 = ((h + 11) % 12) + 1;
  return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
}

export function to24h({ hour12, minute, period }: Time12): string {
  let h = hour12 % 12;
  if (period === 'PM') h += 12;
  return `${h.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

export function from24h(hhmm: string): Time12 {
  const [hStr, mStr] = hhmm.split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  const period: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
  const hour12 = ((h + 11) % 12) + 1;
  return { hour12, minute: Number.isNaN(m) ? 0 : m, period };
}

export const HOURS_12 = Array.from({ length: 12 }, (_, i) => i + 1);
export const MINUTES_5 = Array.from({ length: 12 }, (_, i) => i * 5); // 0, 5, …, 55
