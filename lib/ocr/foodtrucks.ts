import { createWorker, RecognizeResult } from 'tesseract.js';
import path from 'path';
import fs from 'fs';

export interface OCRResultLine {
  text: string;
  confidence: number;
}

export interface ParsedScheduleEntry {
  raw: string;
  truck?: string;
  day?: string;
  timeRange?: string;
}

// Basic heuristics to parse typical schedule lines like:
// "Mon Kona Ice 11:00-3:00" or "Tue Taco Fusion 11:30-2:30"
const DAY_REGEX = /^(mon|tue|wed|thu|fri|sat|sun)\b/i;
const TIME_RANGE_REGEX = /(\d{1,2}:\d{2}\s?(?:am|pm)?)\s?[-–]\s?(\d{1,2}:\d{2}\s?(?:am|pm)?)/i;

export async function runOCR(url: string) {
  // Build absolute paths for worker/core to satisfy Node worker_threads requirement.
  const workerPath = path.join(process.cwd(), 'node_modules', 'tesseract.js', 'dist', 'worker.min.js');
  const coreCandidates = [
    path.join(process.cwd(), 'node_modules', 'tesseract.js-core', 'tesseract-core-simd.wasm.js'),
    path.join(process.cwd(), 'node_modules', 'tesseract.js-core', 'tesseract-core.wasm.js'),
  ];
  const corePath = coreCandidates.find(p => fs.existsSync(p)) || coreCandidates[0];
  const langPath = path.join(process.cwd(), 'node_modules', 'tesseract.js', 'langs');

  const worker = await createWorker({
    workerPath,
    corePath,
    langPath,
    logger: () => {},
  } as any);
  try {
    await (worker as any).load();
    await (worker as any).loadLanguage('eng');
    await (worker as any).initialize('eng');
    const result: RecognizeResult = await (worker as any).recognize(url);
    const data: RecognizeResult['data'] = result.data;
    const lines: OCRResultLine[] = [];
    for (const block of data.blocks || []) {
      for (const paragraph of block.paragraphs || []) {
        for (const line of paragraph.lines || []) {
          const text = (line.text || '').trim();
          if (text) {
            lines.push({ text, confidence: line.confidence });
          }
        }
      }
    }
    return lines.filter(l => l.text && /[a-z0-9]/i.test(l.text));
  } catch (e) {
    // Fallback: return empty with error indicator line so caller can handle gracefully.
    return [{ text: `OCR_ERROR: ${(e as any)?.message || 'unknown'}`, confidence: 0 }];
  } finally {
    await (worker as any).terminate();
  }
}

export function parseSchedule(lines: OCRResultLine[]): ParsedScheduleEntry[] {
  return lines.map(l => {
    const lower = l.text.toLowerCase();
    const dayMatch = lower.match(DAY_REGEX);
    const timeMatch = l.text.match(TIME_RANGE_REGEX);
    let truck: string | undefined;
    let day: string | undefined = dayMatch ? dayMatch[1].toLowerCase() : undefined;
    let timeRange: string | undefined;
    if (timeMatch) {
      timeRange = `${timeMatch[1]}-${timeMatch[2]}`.replace(/\s+/g,'');
    }
    if (day) {
      // remove day token
      const afterDay = l.text.replace(new RegExp('^'+day+'\s*','i'),'');
      // remove time range portion
      if (timeMatch) {
        truck = afterDay.replace(timeMatch[0], '').trim();
      } else {
        truck = afterDay.trim();
      }
      if (truck && /\d/.test(truck)) {
        // if numbers remain maybe parsing wrong; fallback
        truck = truck.replace(/\d.*$/,'').trim();
      }
    }
    return { raw: l.text, truck, day, timeRange };
  });
}
