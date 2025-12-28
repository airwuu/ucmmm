export const runtime = 'edge';
import { NextResponse } from 'next/server';

// Remote source page containing schedule images
const SOURCE_URL = 'https://dining.ucmerced.edu/retail-services/fork-road';

interface ImageWeek {
  url: string;
  label: string; // Human readable
  start: string; // ISO date (guessed year)
  end: string;   // ISO date
}

function guessYear(): number {
  const now = new Date();
  return now.getFullYear();
}

function pad(n: number) { return n.toString().padStart(2, '0'); }

function toISO(year: number, month: number, day: number) {
  return `${year}-${pad(month)}-${pad(day)}`;
}

// Pattern 1: 8-25-8-31.png (startMonth-startDay-endMonth-endDay) - old format
const WEEK_RANGE_REGEX = /src="([^"]*?(\d{1,2})-(\d{1,2})-(\d{1,2})-(\d{1,2})\.png)"/g;
// Pattern 2: 12-8.png (month-day) - new format, assume it's a week starting on that date
const WEEK_SINGLE_REGEX = /src="([^"]*?(\d{1,2})-(\d{1,2})\.png)"/g;

export async function GET() {
  try {
    const res = await fetch(SOURCE_URL, { headers: { 'User-Agent': 'ucmmm-bot/1.0' }, next: { revalidate: 3600 } });
    if (!res.ok) {
      return NextResponse.json({ error: 'failed_fetch', status: res.status }, { status: 500 });
    }
    const html = await res.text();
    const year = guessYear();
    const weeks: ImageWeek[] = [];
    const seen = new Set<string>();

    // Pattern 1: Range format (month-day-month-day.png)
    let m: RegExpExecArray | null;
    while ((m = WEEK_RANGE_REGEX.exec(html)) !== null) {
      const full = m[1];
      const sm = parseInt(m[2], 10);
      const sd = parseInt(m[3], 10);
      const em = parseInt(m[4], 10);
      const ed = parseInt(m[5], 10);
      if (seen.has(full)) continue;
      seen.add(full);
      const startISO = toISO(year, sm, sd);
      const endISO = toISO(year, em, ed);
      const label = `${new Intl.DateTimeFormat('en-US', { month: 'short' }).format(new Date(startISO))} ${sd} – ${new Intl.DateTimeFormat('en-US', { month: sm === em ? undefined : 'short' }).format(new Date(endISO))}${sm === em ? '' : ' '}${ed}`;
      const url = full.startsWith('http') ? full : (new URL(full, SOURCE_URL)).toString();
      weeks.push({ url, label, start: startISO, end: endISO });
    }

    // Pattern 2: Single date format (month-day.png) - assume 7-day week starting on that date
    while ((m = WEEK_SINGLE_REGEX.exec(html)) !== null) {
      const full = m[1];
      // Skip logo/UI images by checking path contains schedule-related keywords or is in page/images
      if (!full.includes('/page/images/') && !full.includes('/files/')) continue;
      // Skip if it's clearly not a schedule (e.g., logos, icons)
      if (full.includes('logo') || full.includes('icon') || full.includes('translate')) continue;

      const sm = parseInt(m[2], 10);
      const sd = parseInt(m[3], 10);
      if (seen.has(full)) continue;
      seen.add(full);

      const startDate = new Date(year, sm - 1, sd);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6); // 7-day week

      const startISO = toISO(year, sm, sd);
      const endISO = toISO(endDate.getFullYear(), endDate.getMonth() + 1, endDate.getDate());
      const label = `${new Intl.DateTimeFormat('en-US', { month: 'short' }).format(startDate)} ${sd} – ${new Intl.DateTimeFormat('en-US', { month: 'short' }).format(endDate)} ${endDate.getDate()}`;
      const url = full.startsWith('http') ? full : (new URL(full, SOURCE_URL)).toString();
      weeks.push({ url, label, start: startISO, end: endISO });
    }

    weeks.sort((a, b) => a.start.localeCompare(b.start));
    return NextResponse.json({ weeks, source: SOURCE_URL, generatedAt: new Date().toISOString() });
  } catch (e: any) {
    return NextResponse.json({ error: 'exception', message: e?.message }, { status: 500 });
  }
}
