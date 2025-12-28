// Placeholder structured schedule (manual beta). Future: OCR & crowdsourcing.
export interface TruckScheduleEntry {
  weekStart: string; // ISO Sunday (or actual schedule start Monday)
  truck: string;
  day: string; // mon,tue,wed,thu,fri
  start: string; // 24h local time HH:MM
  end: string;   // 24h local time HH:MM
  cuisine?: string;
  notes?: string;
}

export const truckSchedule: TruckScheduleEntry[] = [
  { weekStart: '2025-09-01', truck: 'Kona Ice', day: 'wed', start: '11:00', end: '15:00', cuisine: 'Shaved Ice', notes: 'Hot weather treat' },
  { weekStart: '2025-09-01', truck: 'Taco Fusion', day: 'thu', start: '11:00', end: '14:30', cuisine: 'Mexican Fusion' },
  { weekStart: '2025-09-01', truck: 'Wrap & Roll', day: 'fri', start: '11:30', end: '15:30', cuisine: 'Wraps' },
  { weekStart: '2025-09-08', truck: 'Kona Ice', day: 'tue', start: '11:00', end: '15:00', cuisine: 'Shaved Ice' },
  { weekStart: '2025-09-08', truck: 'Taco Fusion', day: 'wed', start: '11:00', end: '14:30', cuisine: 'Mexican Fusion' },
  { weekStart: '2025-09-08', truck: 'Noodle Bowl', day: 'thu', start: '11:30', end: '14:30', cuisine: 'Asian Fusion' },
];

export const daysOrder = ['mon','tue','wed','thu','fri', 'sat', 'sun'];
