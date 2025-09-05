import { NextResponse } from 'next/server';
import { runOCR, parseSchedule } from '@/lib/ocr/foodtrucks';

// This endpoint OCRs the current week's image (or first available) from /api/foodtrucks/images

export const maxDuration = 60; // allow longer for OCR in edge environments
export const runtime = 'nodejs'; // ensure worker_threads support

export async function GET(request: Request) {
  const debug: any[] = [];
  const urlObj = new URL(request.url);
  const wantDebug = urlObj.searchParams.get('debug') === '1';
  const startTs = Date.now();
  function log(step: string, info: any = {}) {
    const entry = { t: Date.now() - startTs, step, ...info };
    debug.push(entry);
    if (wantDebug) {
      // eslint-disable-next-line no-console
      console.log('[foodtrucks/ocr]', entry);
    }
  }
  try {
    log('begin');
    const imagesEndpoint = `${urlObj.origin}/api/foodtrucks/images`;
    log('fetch_images_start', { imagesEndpoint });
    const imgRes = await fetch(imagesEndpoint, { cache: 'no-store', headers: { 'User-Agent': 'ucmmm-ocr/1.0' } });
    log('fetch_images_done', { status: imgRes.status });
    if (!imgRes.ok) {
      log('fetch_images_error_status');
      return NextResponse.json({ error: 'images_fetch_failed', status: imgRes.status, debug: wantDebug ? debug : undefined }, { status: 502 });
    }
    const data = await imgRes.json();
    log('images_json_parsed', { weeksCount: data.weeks?.length });
    const weeks = data.weeks || [];
    if (!weeks.length) {
      log('no_weeks');
      return NextResponse.json({ error: 'no_weeks', debug: wantDebug ? debug : undefined }, { status: 404 });
    }
    const today = new Date().toISOString().slice(0,10);
    const active = weeks.find((w: any)=> today >= w.start && today <= w.end) || weeks[weeks.length-1];
    log('active_week_selected', { active });
    if (!active?.url) {
      log('active_missing_url');
      return NextResponse.json({ error: 'no_active_image', debug: wantDebug ? debug : undefined }, { status: 500 });
    }
    const imageUrl = active.url;
    log('ocr_start', { imageUrl });
    const ocrLines = await runOCR(imageUrl);
    log('ocr_done', { lineCount: ocrLines.length });
    const parsed = parseSchedule(ocrLines);
    log('parse_done', { parsedCount: parsed.length });
    return NextResponse.json({ image: imageUrl, week: { start: active.start, end: active.end, label: active.label }, lines: ocrLines, parsed, debug: wantDebug ? debug : undefined });
  } catch (e: any) {
    log('exception', { message: e?.message, stack: e?.stack });
    return NextResponse.json({ error: 'ocr_failed', message: e?.message, debug: wantDebug ? debug : undefined }, { status: 500 });
  }
}
