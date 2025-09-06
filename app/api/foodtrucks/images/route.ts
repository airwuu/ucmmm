export const runtime = 'edge';
import { NextResponse } from 'next/server';

// Remote source page containing schedule images
const SOURCE_URL = 'https://dining.ucmerced.edu/locations-hours/food-trucks';

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

function pad(n: number) { return n.toString().padStart(2,'0'); }

function toISO(year: number, month: number, day: number) {
  return `${year}-${pad(month)}-${pad(day)}`;
}

// Patterns: 8-25-8-31.png OR 9-1-9-7.png (startMonth-startDay-endMonth-endDay)
// Fallback simpler pattern (rare) startMonth-startDay.png (single day) not expected but included.
const WEEK_REGEX = /src="([^"]*?(\d{1,2})-(\d{1,2})-(\d{1,2})-(\d{1,2})\.png)"/g;

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
    let m: RegExpExecArray | null;
    while ((m = WEEK_REGEX.exec(html)) !== null) {
      const full = m[1];
      const sm = parseInt(m[2],10);
      const sd = parseInt(m[3],10);
      const em = parseInt(m[4],10);
      const ed = parseInt(m[5],10);
      const key = full;
      if (seen.has(key)) continue;
      seen.add(key);
      const startISO = toISO(year, sm, sd);
      const endISO = toISO(year, em, ed);
      const label = `${new Intl.DateTimeFormat('en-US', { month: 'short'}).format(new Date(startISO))} ${sd} – ${new Intl.DateTimeFormat('en-US', { month: sm===em? undefined:'short'}).format(new Date(endISO))}${sm===em?'': ' '}${ed}`;
      // Ensure absolute URL
      const url = full.startsWith('http') ? full : (new URL(full, SOURCE_URL)).toString();
      weeks.push({ url, label, start: startISO, end: endISO });
    }
    weeks.sort((a,b)=> a.start.localeCompare(b.start));
    return NextResponse.json({ weeks, source: SOURCE_URL, generatedAt: new Date().toISOString() });
  } catch (e: any) {
    return NextResponse.json({ error: 'exception', message: e?.message }, { status: 500 });
  }
}
