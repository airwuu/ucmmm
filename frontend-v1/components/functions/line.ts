export interface LineEstimateResult {
  score: number; // 0-100
  level: 'low' | 'moderate' | 'high' | 'peak';
  reason: string;
  nearestRelease?: string;
}

// Common class release times (minutes from midnight) per weekday pattern.
// Monday=1 ... Sunday=0 (Date.getDay())
const MWF_ENDS = [8,9,10,11,12,13,14,15,16,17,18,19,20,21,22].map(h=>h*60+20); // :20 endings
// Additional quarter-hour endings (evening / some extended blocks)
const QUARTER_ENDS = [20*60+15, 19*60+45]; // 8:15 PM, 7:45 PM examples (sparse)

// Tue/Thu have :20 plus many :15 / :45 blocks.
const TR_QUARTER_ENDS = [10,11,13,14,16,17,19,20,22].flatMap(h=>[h*60+15]) // :15 endings
  .concat([11,13,14,16,17,19,20].map(h=>h*60+45)); // sample :45 endings

// One-day 3h block endings (used lightly for weekends / special): 10:20, 13:20, 16:20, 19:20, 22:20
const SINGLE_DAY_ENDS = [10,13,16,19,22].map(h=>h*60+20);

function minutesSinceMidnight(d: Date) { return d.getHours()*60 + d.getMinutes(); }

function getReleaseTimes(day: number): number[] {
  // day: 0=Sun 1=Mon ... 6=Sat
  if (day === 0 || day === 6) {
    // weekend: minimal academic traffic; treat as sparse baseline
    return SINGLE_DAY_ENDS; 
  }
  if (day === 2 || day === 4) { // Tue / Thu
    return Array.from(new Set([
      ...MWF_ENDS, // still many :20 endings from 1h blocks
      ...TR_QUARTER_ENDS
    ])).sort((a,b)=>a-b);
  }
  // M / W / F
  return Array.from(new Set([
    ...MWF_ENDS,
    ...QUARTER_ENDS
  ])).sort((a,b)=>a-b);
}

function mealBaseScore(meal: string, location: string): number {
  // Rough baseline by observed traffic patterns.
  if (location === 'dc') {
    switch(meal){
      case 'breakfast': return 25;
      case 'lunch': return 55;
      case 'dinner': return 45;
      case 'late_night': return 30;
      default: return 30;
    }
  }
  switch(meal){
    case 'breakfast': return 20;
    case 'lunch': return 50;
    case 'dinner': return 40;
    default: return 30;
  }
}

export function estimateLineSize(date: Date, meal: string, location: string): LineEstimateResult {
  const mins = minutesSinceMidnight(date);
  const releases = getReleaseTimes(date.getDay());
  const base = mealBaseScore(meal, location);

  // Surge contribution from nearby release times within a window.
  // Window: -5 (before) to +25 (after). Biggest spike within first 7 minutes after.
  let surge = 0;
  let nearestDiff = Infinity;
  let nearestRelease: number | undefined;
  for (const r of releases) {
    const diff = mins - r; // positive if after release
    if (diff >= -5 && diff <= 25) {
      const window = 30; // total span considered
      // Emphasize immediate after: use triangular curve. Peak at diff=2.
      const peakCenter = 2; // minutes after release peak line growth
      const distFromPeak = Math.abs(diff - peakCenter);
      const weight = Math.max(0, 1 - distFromPeak / (window/2));
      surge = Math.max(surge, weight * 42); // 42 ~ max surge addition
    }
    const absDiff = Math.abs(diff);
    if (absDiff < nearestDiff) { nearestDiff = absDiff; nearestRelease = r; }
  }

  // Mild decay if far from any pattern (mid-block lull): reduce base slightly
  if (nearestDiff > 35) {
    // lull
    surge -= 8;
  }

  let raw = base + surge;
  raw = Math.max(0, Math.min(100, raw));

  let level: LineEstimateResult['level'];
  if (raw > 75) level = 'peak';
  else if (raw > 50) level = 'high';
  else if (raw > 30) level = 'moderate';
  else level = 'low';

  const toHM = (m:number)=>{
    const h=Math.floor(m/60); const mm=(m%60).toString().padStart(2,'0');
    const suffix = h===0? '12' : ((h>12)? (h-12).toString() : h.toString());
    const ampm = h<12? 'AM':'PM';
    return `${suffix}:${mm} ${ampm}`;
  };

  const reasonParts: string[] = [];
  reasonParts.push(`${meal.replace('_',' ')} period`);
  if (nearestRelease !== undefined) {
    const relMins = nearestRelease;
    const diff = mins - relMins;
    if (diff >= -5 && diff <= 25) {
      reasonParts.push(`recent class release (${diff >= 0 ? diff : Math.abs(diff)} min ${diff>=0? 'after':'before'} ${toHM(relMins)})`);
    } else {
      reasonParts.push(`~${nearestDiff} min from next release (${toHM(relMins)})`);
    }
  }

  return {
    score: raw,
    level,
    reason: reasonParts.join(' | '),
    nearestRelease: nearestRelease !== undefined ? toHM(nearestRelease) : undefined
  };
}
