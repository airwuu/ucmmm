"use client";
import React, { useMemo, useEffect, useState, useRef } from 'react';
import { truckSchedule, daysOrder, TruckScheduleEntry } from '@/data/foodtrucks';

interface WeekImage {
  start: string; // YYYY-MM-DD (local PDT)
  end: string;   // inclusive YYYY-MM-DD
  url: string;
  label: string; // readable range
}

// Fallback static mapping; replaced / merged with dynamic fetch if available.
const STATIC_WEEK_IMAGES: WeekImage[] = [
  { start: '2025-08-25', end: '2025-08-31', url: 'https://dining.ucmerced.edu/sites/g/files/ufvvjh726/f/page/images/8-25-8-31.png', label: 'Aug 25 – Aug 31' },
  { start: '2025-09-01', end: '2025-09-07', url: 'https://dining.ucmerced.edu/sites/g/files/ufvvjh726/f/page/images/9-1-9-7.png', label: 'Sep 1 – Sep 7' },
  { start: '2025-09-08', end: '2025-09-14', url: 'https://dining.ucmerced.edu/sites/g/files/ufvvjh726/f/page/images/9-8-9-14.png', label: 'Sep 8 – Sep 14' },
];

function toDatePDT(date: Date): Date {
  // Convert to PDT components via Intl then rebuild Date (keeps day semantics for schedule selection)
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' });
  const parts = fmt.formatToParts(date).reduce<Record<string,string>>((acc,p)=>{ if(p.type!=='literal') acc[p.type]=p.value; return acc;}, {});
  return new Date(`${parts.year}-${parts.month}-${parts.day}T00:00:00-07:00`); // PDT offset assumption
}

function formatISO(d: Date): string {
  return d.toISOString().slice(0,10);
}

function isBetween(target: string, start: string, end: string): boolean {
  return target >= start && target <= end;
}

const FoodTrucks: React.FC = () => {
  const todayISO = useMemo(()=> formatISO(toDatePDT(new Date())), []);
  const todayDay = useMemo(() => {
    const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const d = new Date();
    const pdtDate = toDatePDT(d);
    return days[pdtDate.getDay()];
  }, []);


  const [weeks, setWeeks] = useState<WeekImage[]>(STATIC_WEEK_IMAGES);
  //const [weeks, setWeeks] = useState<WeekImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|undefined>();
  const [tab, setTab] = useState<'structured' | 'image'>('structured');
  const [truckFilter, setTruckFilter] = useState<string>('all');
  const [dayFilter, setDayFilter] = useState<string>(todayDay);
  // Table OCR (restart pipeline) state
  const [tableOcrLoading, setTableOcrLoading] = useState(false);
  const [tableOcrError, setTableOcrError] = useState<string|undefined>();
  const [tableOcrResult, setTableOcrResult] = useState<any[]|null>(null);
  const [rawTableText, setRawTableText] = useState<string|undefined>();
  const [tableOcrProgress, setTableOcrProgress] = useState<number>(0);
  const [tableOcrDebug, setTableOcrDebug] = useState<any|null>(null);
  const ocrBtnRef = useRef<HTMLButtonElement|null>(null);
  const autoRunRef = useRef(false);

  // (moved below 'active')
  // OpenCV integration
  const [cvReady, setCvReady] = useState(false);
  const [cvError, setCvError] = useState<string|undefined>();

  // Dynamically load OpenCV.js (only once on client)
  useEffect(()=>{
    if (typeof window === 'undefined') return;
    if ((window as any).cv && (window as any).cv.imread) { setCvReady(true); return; }
    const script = document.createElement('script');
    script.src = 'https://docs.opencv.org/4.x/opencv.js';
    script.async = true;
    script.onload = () => {
      const waitReady = () => {
        try {
          if ((window as any).cv && (window as any).cv.imread) { setCvReady(true); return; }
        } catch {}
        setTimeout(waitReady, 50);
      };
      waitReady();
    };
    script.onerror = () => setCvError('Failed to load OpenCV.js');
    document.head.appendChild(script);
    // no cleanup removal to cache the library
  },[]);

  useEffect(()=>{
    let cancelled=false;
    (async()=>{
      setLoading(true); setError(undefined);
      try {
        const res = await fetch('/api/foodtrucks/images');
        if (!res.ok) throw new Error(`status ${res.status}`);
        const data = await res.json();
        if (!cancelled && data.weeks?.length) {
          setWeeks(data.weeks);
        }
      } catch(e:any){
        if(!cancelled) setError(e.message);
      } finally {
        if(!cancelled) setLoading(false);
      }
    })();
    return ()=>{cancelled=true};
  },[]);

  const active = useMemo(()=> weeks.find(w => isBetween(todayISO, w.start, w.end)), [todayISO, weeks]);

  const weekStartForStructured = useMemo(()=> active?.start || truckSchedule[0]?.weekStart, [active]);

  // Derive schedule entries from table OCR result if present
  const ocrTableEntries = useMemo<TruckScheduleEntry[]>(()=> {
    if(!tableOcrResult || !tableOcrResult.length) return [];
    // Identify location column (case-insensitive) default to first key
    const sample = tableOcrResult[0];
    const keys = Object.keys(sample);
    const locationKey = keys.find(k=> /location/i.test(k)) || keys[0];
    const dayKeyMap: Record<string,string> = {};
    const canonical = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
    for(const k of keys){
      const norm = k.toLowerCase();
      const found = canonical.find(c=> c.toLowerCase()===norm);
      if(found) dayKeyMap[found] = k; // map canonical day -> actual column key
    }
    const entries: TruckScheduleEntry[] = [];
    const WEEK = weekStartForStructured;
    // time parser
    function parseHours(src: string){
      const m = src.match(/(\d{1,2})(?::(\d{2}))?\s?(am|pm)?\s?[-–]\s?(\d{1,2})(?::(\d{2}))?\s?(am|pm)?/i);
      if(!m) return null;
      const [ , h1, mm1, ap1, h2, mm2, ap2] = m;
      function to24(hs:string, mm:string|undefined, ap:string|undefined, inheritAp?:string){
        let h = parseInt(hs,10);
        let apUse = ap || inheritAp || '';
        if(apUse){
          if(apUse.toLowerCase()==='pm' && h!==12) h+=12;
          if(apUse.toLowerCase()==='am' && h===12) h=0;
        }
        return `${h.toString().padStart(2,'0')}:${(mm||'00')}`;
      }
      const start = to24(h1, mm1, ap1, ap2); // inherit end period if start missing
      const end = to24(h2, mm2, ap2, ap1);
      return { start, end };
    }
    function abbrev(day:string){ return day.slice(0,3).toLowerCase(); }
    for(const row of tableOcrResult){
      const locRaw = (row[locationKey]||'').trim();
      if(!locRaw) continue;
      let hours = parseHours(locRaw) || { start: '10:00', end: '18:00' };
      for(const day of Object.keys(dayKeyMap)){
        const cell = (row[ dayKeyMap[day] ]||'').trim();
        if(!cell) continue;
        if(/^(closed|holiday)$/i.test(cell)) continue;
        const truck = cell.replace(/[^A-Za-z0-9&'()\-\s]/g,'').trim();
        if(!truck) continue;
        // Extend hours to 11pm for El Taco when hours were not explicitly parsed (i.e., we used default)
        if (!parseHours(locRaw) && /el\s*taco/i.test(truck)) {
          hours = { start: '10:00', end: '23:00' };
        }
        entries.push({ weekStart: WEEK, truck, day: abbrev(day), start: hours.start, end: hours.end, notes: 'ocr-table' });
      }
    }
    return entries;
  }, [tableOcrResult, weekStartForStructured]);

  const structuredEntries = useMemo(()=> {
    if(ocrTableEntries.length) return ocrTableEntries; // override placeholders
    return truckSchedule.filter(e=> e.weekStart === weekStartForStructured);
  }, [ocrTableEntries, weekStartForStructured]);

  const usingOcrTable = !!ocrTableEntries.length;
  const trucks = useMemo(()=> Array.from(new Set(structuredEntries.map(e=> e.truck))).sort(), [structuredEntries]);
  const filteredEntries = useMemo(()=> structuredEntries.filter(e => (truckFilter==='all'|| e.truck===truckFilter) && (dayFilter==='all'|| e.day===dayFilter)), [structuredEntries, truckFilter, dayFilter]);

  function groupByDay(entries: TruckScheduleEntry[]) {
    return daysOrder.reduce<Record<string, TruckScheduleEntry[]>>((acc,d)=>{acc[d]=entries.filter(e=>e.day===d);return acc;}, {});
  }

  // Format 24h 'HH:MM' to 12h with AM/PM (e.g., '13:05' -> '1:05 PM')
  function to12h(t?: string) {
    if(!t) return '';
    const m = t.match(/^(\d{1,2}):(\d{2})$/);
    if(!m) return t; // fallback if unexpected format
    let [_, hh, mm] = m;
    let h = parseInt(hh,10);
    const suffix = h>=12 ? 'PM' : 'AM';
    if(h===0) h=12; else if(h>12) h-=12;
    return `${h}:${mm} ${suffix}`;
  }
  const runOcr = async()=>{
    if(!active?.url) return;
    setTableOcrLoading(true); setTableOcrError(undefined); setTableOcrResult(null); setRawTableText(undefined); setTableOcrProgress(0);
    let objectUrl: string | undefined;
    try {
      const mod:any = await import('tesseract.js');
      setTableOcrProgress(0.1);
      // Fetch via proxy first to avoid cross-origin issues inside worker
      try {
        const proxied = await fetch(`/api/proxy/image?url=${encodeURIComponent(active.url)}`);
        if (!proxied.ok) throw new Error(`proxy ${proxied.status}`);
        const blob = await proxied.blob();
        objectUrl = URL.createObjectURL(blob);
      } catch (proxyErr:any) {
        console.warn('[table-ocr] proxy failed, fallback direct', proxyErr);
        setTableOcrError(prev=> prev? prev+`; proxy:${proxyErr.message}`: `proxy:${proxyErr.message}`);
        objectUrl = active.url; // fallback direct
      }
      setTableOcrProgress(0.3);
      const recTarget = objectUrl!;
      let text: string = '';
      let segmentationInfo: any = null;
      let gridInfo: any = null;
      let gridRowsResult: any[] | null = null;
      // Attempt OpenCV row segmentation for more reliable line capture
      if (cvReady && (window as any).cv) {
        try {
          const cv = (window as any).cv as any;
          // Load image into canvas
          const imgEl = new Image();
          await new Promise(res=>{ imgEl.onload=()=>res(null); imgEl.onerror=()=>res(null); imgEl.src = recTarget; });
          const canvas = document.createElement('canvas');
          canvas.width = imgEl.width; canvas.height = imgEl.height;
          const ctx = canvas.getContext('2d');
          if (ctx) ctx.drawImage(imgEl,0,0);
          const src = cv.imread(canvas);
          const gray = new cv.Mat();
          if (src.channels()===4) cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY); else src.copyTo(gray);
          const bin = new cv.Mat();
          cv.threshold(gray, bin, 0, 255, cv.THRESH_BINARY | cv.THRESH_OTSU);
          // Invert if background darker than foreground
          const whitePixels = cv.countNonZero(bin);
          const whiteRatio = whitePixels / (bin.rows * bin.cols);
          if (whiteRatio < 0.5) {
            const inv = new cv.Mat();
            cv.bitwise_not(bin, inv);
            bin.delete();
            (inv as any).copyTo(bin);
            inv.delete();
          }
          // Try full grid (horizontal + vertical line) detection first for cell OCR
          try {
            const work = new cv.Mat();
            cv.adaptiveThreshold(gray, work, 255, cv.ADAPTIVE_THRESH_MEAN_C, cv.THRESH_BINARY_INV, 21, 10);
            // Horizontal lines
            const horiz = new cv.Mat(); work.copyTo(horiz);
            const hSize = Math.max(10, Math.floor(work.cols / 30));
            const hKernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(hSize,1));
            cv.erode(horiz, horiz, hKernel);
            cv.dilate(horiz, horiz, hKernel);
            // Vertical lines
            const vert = new cv.Mat(); work.copyTo(vert);
            const vSize = Math.max(8, Math.floor(work.rows / 25));
            const vKernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(1,vSize));
            cv.erode(vert, vert, vKernel);
            cv.dilate(vert, vert, vKernel);
            // Collect horizontal line y positions
            const horizProfile: number[] = [];
            for (let y=0;y<horiz.rows;y++) {
              let cnt=0; for (let x=0;x<horiz.cols;x++){ if(horiz.ucharPtr(y,x)[0]>0) cnt++; }
              horizProfile.push(cnt);
            }
            const hThresh = horiz.cols * 0.5; // 50% width coverage
            let horizLines: number[] = [];
            for (let y=0;y<horizProfile.length;y++) if (horizProfile[y] > hThresh) horizLines.push(y);
            // Collapse clusters
            const collapse = (arr:number[]) => { const out:number[]=[]; let i=0; while(i<arr.length){ let j=i; while(j+1<arr.length && arr[j+1]-arr[j] < 4) j++; out.push(Math.round((arr[i]+arr[j])/2)); i=j+1;} return out; };
            horizLines = collapse(horizLines);
            if (horizLines[0] !== 0) horizLines.unshift(0); if (horizLines[horizLines.length-1] !== work.rows-1) horizLines.push(work.rows-1);
            // Collect vertical line x positions
            const vertProfile: number[] = [];
            for (let x=0;x<vert.cols;x++) { let cnt=0; for (let y=0;y<vert.rows;y++){ if(vert.ucharPtr(y,x)[0]>0) cnt++; } vertProfile.push(cnt); }
            const vThresh = vert.rows * 0.5;
            let vertLines: number[] = [];
            for (let x=0;x<vertProfile.length;x++) if (vertProfile[x] > vThresh) vertLines.push(x);
            vertLines = collapse(vertLines);
            if (vertLines[0] !== 0) vertLines.unshift(0); if (vertLines[vertLines.length-1] !== work.cols-1) vertLines.push(work.cols-1);
            // Validate plausible grid (expect at least 3 rows, 5 columns)
            if (horizLines.length >= 3 && vertLines.length >= 5 && horizLines.length * vertLines.length < 1200) {
              const cellBoxes: {r:number;c:number;x:number;y:number;w:number;h:number}[] = [];
              for (let r=0;r<horizLines.length-1;r++) {
                const y0 = horizLines[r]; const y1 = horizLines[r+1];
                if (y1 - y0 < 12) continue; // ignore very thin
                for (let c=0;c<vertLines.length-1;c++) {
                  const x0 = vertLines[c]; const x1 = vertLines[c+1];
                  if (x1 - x0 < 12) continue;
                  cellBoxes.push({ r, c, x: x0, y: y0, w: x1 - x0, h: y1 - y0 });
                }
              }
              // OCR cells
              const rowsCount = horizLines.length -1;
              const colsCount = vertLines.length -1;
              const tableMatrix: string[][] = Array.from({length: rowsCount}, ()=> Array(colsCount).fill(''));
              let usedWorker = false;
              let worker:any = null;
              try {
                if (mod.createWorker) {
                  worker = await mod.createWorker('eng');
                  usedWorker = true;
                  if(worker.setParameters) await worker.setParameters({ tessedit_pageseg_mode: '7' });
                }
              } catch {}
              for (let i=0;i<cellBoxes.length;i++) {
                const box = cellBoxes[i];
                setTableOcrProgress(0.1 + (i / cellBoxes.length) * 0.55); // up to ~0.65
                try {
                  const cellCanvas = document.createElement('canvas');
                  cellCanvas.width = box.w; cellCanvas.height = box.h;
                  const cctx = cellCanvas.getContext('2d');
                  if (cctx) cctx.drawImage(canvas, box.x, box.y, box.w, box.h, 0,0, box.w, box.h);
                  const dataUrl = cellCanvas.toDataURL('image/png');
                  let cellText = '';
                  try {
                    if (worker) {
                      const { data } = await worker.recognize(dataUrl, { tessedit_pageseg_mode: '7' });
                      cellText = (data.text||'').trim();
                    } else {
                      const { data } = await mod.recognize(dataUrl, 'eng', { tessedit_pageseg_mode: '7' });
                      cellText = (data.text||'').trim();
                    }
                  } catch {}
                  cellText = cellText.replace(/\s+/g,' ');
                  tableMatrix[box.r][box.c] = cellText;
                } catch {}
              }
              if (worker) { try { await worker.terminate(); } catch {} }
              // Derive header row (first non-empty majority row)
              const canonicalDays = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
              const normalizeLetters = (s:string) => s.toLowerCase().replace(/[^a-z]/g,'');
              const levenshtein = (a:string,b:string) => { const m=a.length,n=b.length; const dp=Array.from({length:m+1},(_,i)=>Array(n+1).fill(0)); for(let i=0;i<=m;i++) dp[i][0]=i; for(let j=0;j<=n;j++) dp[0][j]=j; for(let i=1;i<=m;i++){ for(let j=1;j<=n;j++){ dp[i][j]=Math.min(dp[i-1][j]+1,dp[i][j-1]+1,dp[i-1][j-1]+(a[i-1]===b[j-1]?0:1)); } } return dp[m][n]; };
              const fuzzyDay = (tok:string) => {
                const norm = normalizeLetters(tok);
                if(!norm) return null; let best: {d:string;dist:number}|null=null; for(const d of canonicalDays){ const dn=normalizeLetters(d); const dist=levenshtein(norm,dn); if(dist<=3 && (!best||dist<best.dist)) best={d,dist}; } return best? best.d : null;
              };
              let headerRowIndex = 0;
              let headerCells = tableMatrix[0];
              for (let r=0; r<tableMatrix.length; r++) {
                const cells = tableMatrix[r];
                const score = cells.reduce((acc,c)=> acc + (fuzzyDay(c)?1:0),0);
                if (score >= 3) { headerRowIndex = r; headerCells = cells; break; }
              }
              // Build headers forced canonical if days detected
              const hasDayCell = headerCells.some(c=> fuzzyDay(c));
              let headers: string[] = [];
              if (hasDayCell) {
                headers = ['Location', ...canonicalDays];
              } else {
                headers = headerCells.map((c,i)=> c || `Col${i+1}`);
              }
              // Map day columns to their index using fuzzyDay on headerCells
              const dayIndexMap: Record<string, number> = {};
              if (hasDayCell) {
                for (let c=0;c<headerCells.length;c++) {
                  const d = fuzzyDay(headerCells[c]); if (d && dayIndexMap[d]===undefined) dayIndexMap[d] = c;
                }
              }
              const rows: any[] = [];
              for (let r=0;r<tableMatrix.length;r++) {
                if (r===headerRowIndex) continue;
                const cells = tableMatrix[r];
                if (cells.every(c=> !c)) continue;
                const obj: Record<string,string> = {};
                if (hasDayCell) {
                  // Location assumed left of first day index
                  const firstDayCol = Math.min(...Object.values(dayIndexMap));
                  const locCells = cells.slice(0, firstDayCol).filter(Boolean);
                  obj['Location'] = locCells.join(' ').trim();
                  for (const day of canonicalDays) {
                    const idx = dayIndexMap[day];
                    if (idx!=null) obj[day] = cells[idx] || '';
                  }
                } else {
                  headers.forEach((h,i)=> { obj[h] = cells[i] || ''; });
                }
                rows.push(obj);
              }
              // Filter out empty location rows
              const filteredRows = rows.filter(r=> Object.values(r).some(v=> typeof v === 'string' && v.trim().length>1));
              if (filteredRows.length >= 2 && hasDayCell) {
                gridRowsResult = filteredRows;
                gridInfo = { rows: rowsCount, cols: colsCount, horizLines: horizLines.length, vertLines: vertLines.length, cells: cellBoxes.length, usedWorker, headerRowIndex };
              }
            }
            work.delete();
            horiz.delete(); vert.delete(); hKernel.delete(); vKernel.delete();
          } catch (gridErr:any) {
            gridInfo = { error: gridErr?.message || String(gridErr) };
          }
          // Dilate slightly vertically to connect characters into lines (legacy row segmentation fallback)
          const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(1,4));
          const dil = new cv.Mat();
          cv.dilate(bin, dil, kernel);
          // Horizontal projection profile
          const rowSums: number[] = [];
          for (let y=0;y<dil.rows;y++) {
            let count=0; for (let x=0;x<dil.cols;x++) { if (dil.ucharPtr(y,x)[0] > 0) count++; }
            rowSums.push(count);
          }
          const maxSum = Math.max(...rowSums);
          const active = rowSums.map(v=> v > maxSum * 0.04); // 4% threshold
          const bands: {y0:number;y1:number}[] = [];
          let start=-1;
          for (let y=0;y<active.length;y++) {
            if (active[y] && start===-1) start=y;
            if ((!active[y] || y===active.length-1) && start!==-1) {
              const end = active[y] ? y : y-1;
              if (end - start > 5) bands.push({ y0:start, y1:end });
              start=-1;
            }
          }
          // Merge very close bands
          const merged: {y0:number;y1:number}[] = [];
          for (const b of bands) {
            if (!merged.length) merged.push(b); else {
              const last = merged[merged.length-1];
              if (b.y0 - last.y1 < 3) last.y1 = b.y1; else merged.push(b);
            }
          }
          // Extract band images
          const bandImages: string[] = [];
          for (const b of merged.slice(0,70)) {
            const h = b.y1 - b.y0 + 1;
            if (h < 10) continue; // avoid noise
            const rowCanvas = document.createElement('canvas');
            rowCanvas.width = canvas.width;
            rowCanvas.height = h + 4; // pad
            const rctx = rowCanvas.getContext('2d');
            if (rctx) rctx.drawImage(canvas, 0, b.y0, canvas.width, h, 0, 2, canvas.width, h);
            bandImages.push(rowCanvas.toDataURL('image/png'));
          }
          segmentationInfo = { bands: bands.length, merged: merged.length, exported: bandImages.length, width: canvas.width, height: canvas.height };
          // If grid segmentation succeeded we skip band-based OCR
          if (!gridRowsResult && bandImages.length >= 3) {
            const linePieces: string[] = [];
            for (let i=0;i<bandImages.length;i++) {
              setTableOcrProgress(0.3 + (i / bandImages.length) * 0.35); // up to ~0.65
              try {
                const { data } = await mod.recognize(bandImages[i], 'eng', { tessedit_pageseg_mode: '7' });
                const t = (data.text || '').trim();
                if (t) linePieces.push(t.replace(/\s+/g,' '));
              } catch {}
              if (linePieces.length > 90) break; // safety
            }
            text = linePieces.join('\n');
          }
          src.delete(); gray.delete(); bin.delete(); kernel.delete(); dil.delete();
        } catch (segErr:any) {
          segmentationInfo = { error: segErr?.message || String(segErr) };
        }
      }
      if (gridRowsResult) {
        // Use grid rows directly; skip line-based parsing pipeline below
        setTableOcrDebug((prev:any)=> ({ ...(prev||{}), grid: gridInfo, segmentation: segmentationInfo, cvReady, cvError }));
        setTableOcrResult(gridRowsResult);
        setTableOcrProgress(1);
        return;
      }
      if (!text) {
        // Fallback single pass recognition
        try {
          const { data } = await mod.recognize(recTarget, 'eng');
          text = data.text || '';
        } catch (recErr:any) {
          throw new Error(`recognize failed: ${recErr.message || recErr}`);
        }
      }
      setTableOcrProgress(0.7);
      setRawTableText(text);
      // Step 2: lines
      const lines = text.split(/\n+/).map((l:string)=>l.trim()).filter((l:string)=>l.length>0);
      // Helper utilities for adaptive parsing
      const weekdayTokens = ['mon','monday','tue','tues','tuesday','wed','wednesday','thu','thur','thurs','thursday','fri','friday','sat','saturday','sun','sunday'];
      const canonicalDays = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
      const normalizeLetters = (s:string) => s.toLowerCase().replace(/[^a-z]/g,'');
      const isWeekdayNorm = (tokNorm:string) => weekdayTokens.includes(tokNorm);
      const levenshtein = (a:string,b:string) => { const m=a.length,n=b.length; const dp=Array.from({length:m+1},(_,i)=>Array(n+1).fill(0)); for(let i=0;i<=m;i++) dp[i][0]=i; for(let j=0;j<=n;j++) dp[0][j]=j; for(let i=1;i<=m;i++){ for(let j=1;j<=n;j++){ dp[i][j]=Math.min(dp[i-1][j]+1,dp[i][j-1]+1,dp[i-1][j-1]+(a[i-1]===b[j-1]?0:1)); } } return dp[m][n]; };
      const fuzzyDay = (tok:string) => {
        const norm = normalizeLetters(tok);
        if(!norm) return null;
        let best: {day:string; dist:number}|null = null;
        for(const d of canonicalDays){ const dn=normalizeLetters(d); const dist=levenshtein(norm,dn); if(dist<=3 && (!best||dist<best.dist)) best={day:d, dist}; }
        return best? best.day : null;
      };
      // Strategy A: multi-space
      const strategyA = lines.map((l: string)=> l.split(/\s{2,}/).filter(Boolean));
      // Strategy B: pipe / bracket heavy tables
      const strategyB = lines.map((l:string)=> l.replace(/[\[\]]/g,' ').split(/\|/).map(s=>s.trim()).filter(Boolean));
      const scoreHeaderSet = (arr:string[][]) => {
        if(!arr.length) return {score:0,index:0};
        let best=0, idx=0;
        for(let i=0;i<Math.min(arr.length,6);i++){
          const toks=arr[i];
          let s=0; for(const t of toks){ const f=fuzzyDay(t); if(f) s+=3; if(/day$/i.test(t)) s+=1; }
          if(s>best){ best=s; idx=i; }
        }
        return {score:best,index:idx};
      };
      const scoreA = scoreHeaderSet(strategyA);
      const scoreB = scoreHeaderSet(strategyB);
      let tableArray: string[][] = scoreB.score > scoreA.score ? strategyB : strategyA;
      let headerIndex = (scoreB.score > scoreA.score ? scoreB.index : scoreA.index);
      if (!tableArray.length) throw new Error('No table-like lines detected');
      let rawHeaderTokens = tableArray[headerIndex];
      // Clean header tokens
      rawHeaderTokens = rawHeaderTokens.map(t=> t.replace(/^[^A-Za-z]+|[^A-Za-z]+$/g,'')).filter(Boolean);
      // Expand if tokens merged: attempt to split tokens containing mixtures of letters with uppercase boundaries (rare)
      const headerTokensExpanded: string[] = [];
      for(const t of rawHeaderTokens){
        if(/[A-Z][a-z]+[A-Z]/.test(t)) { headerTokensExpanded.push(...t.split(/(?=[A-Z][a-z])/)); } else headerTokensExpanded.push(t);
      }
      let headerTokens = headerTokensExpanded.filter(Boolean);
      // Fuzzy map to canonical day names
      headerTokens = headerTokens.map(tok=>{
        const day = fuzzyDay(tok);
        return day ? day : tok;
      });
      // Remove stray pipe-like or short noise tokens
      headerTokens = headerTokens.filter(tok=> tok.length>1 && tok!=='I');
      // Ensure unique order while keeping sequence
      const seen = new Set<string>();
      headerTokens = headerTokens.filter(t=>{ const key=t.toLowerCase(); if(seen.has(key)) return true; seen.add(key); return true; });
      // If days present but no Location, add it at start
      const lower = headerTokens.map(h=>h.toLowerCase());
      const hasDay = lower.some(h=> canonicalDays.map(c=>c.toLowerCase()).includes(h));
      let headers = headerTokens.slice();
      if (hasDay) {
        // Force canonical header ordering
        headers = ['Location', ...canonicalDays];
      }
      // Build body rows
      const bodyLines = tableArray.filter((_,i)=> i!==headerIndex);
      const rows = bodyLines.map(lineTokens=>{
        const obj: Record<string,string> = {};
        // If pipe strategy chosen originally we might have cleaner segments already
        let tokens = lineTokens.slice();
        // Clean tokens
        tokens = tokens.map(t=> t.trim()).filter(Boolean);
        // Attempt to detect location portion
        let dayPositions: number[] = [];
        tokens.forEach((tok,i)=>{ if(fuzzyDay(tok)) dayPositions.push(i); });
        let loc = '';
        if(headers[0]==='Location'){
          if(dayPositions.length){
            const firstDayPos = dayPositions[0];
            loc = tokens.slice(0, firstDayPos).join(' ');
            tokens = tokens.slice(firstDayPos); // remaining are day columns
          } else {
            // whole line might be location/time only
            loc = tokens.join(' ');
            tokens = [];
          }
          obj['Location'] = loc.replace(/\s{2,}/g,' ').trim();
        }
        // Map remaining tokens to headers (excluding Location)
        const dayHeaders = headers.filter(h=> h!=='Location');
        dayHeaders.forEach((h,i)=>{ obj[h] = tokens[i] || ''; });
        return obj;
      }).filter(r=> Object.keys(r).length>0 && Object.values(r).some(v=>v));
      setTableOcrDebug({ chosenStrategy: scoreB.score > scoreA.score ? 'pipe' : 'spaces', scoreA, scoreB, headerIndex, rawHeaderTokens, enforcedHeaders: headers, previewFirstRow: rows[0], segmentation: segmentationInfo, cvReady, cvError });
      setTableOcrResult(rows);
      setTableOcrProgress(1);
    } catch(e:any) {
      setTableOcrError(e.message ?? String(e));
    } finally {
      if (objectUrl && objectUrl.startsWith('blob:')) { try { URL.revokeObjectURL(objectUrl); } catch {} }
      setTableOcrLoading(false);
    }
  };
  const grouped = useMemo(()=> groupByDay(filteredEntries), [filteredEntries]);
  const ocrGrouped = useMemo(() => groupByDay(ocrTableEntries.filter(e => e.day === todayDay)), [ocrTableEntries, todayDay]);

  useEffect(() => {
    if (autoRunRef.current) return;
    if (active?.url && cvReady) {
      autoRunRef.current = true; 
      runOcr();
    }
  }, [active, cvReady, runOcr]);

  return (
    <div className="relative snap-center shrink-0 w-[300px] rounded-lg max-w-[300px] px-5 py-3 flex flex-col bg-content1">
      <h1 className="mb-4 text-2xl text-primary/90 font-extrabold flex justify-center items-center gap-2"> Food Trucks <span className="text-[10px] uppercase tracking-wide px-1  rounded bg-yellow-500/20 text-yellow-600 dark:text-yellow-400">beta</span></h1>
      {/* Tabs */}
      <div className="flex text-[11px] mb-2 rounded overflow-hidden border border-foreground/10 w-full">
        {['structured', 'image'].map(t=> (
          <button key={t} onClick={()=>setTab(t as any)} className={`flex-1 py-1 capitalize ${tab===t? 'bg-primary/20 text-primary font-semibold':'bg-content2/40 text-foreground/50'}`}>{t === 'image' ? 'OCR' : 'Today'}</button>
        ))}
      </div>
	  
      {tab==='structured' && (
        <div className="flex flex-col gap-2 text-xs">
           <p className="text-foreground/50">Food Trucks Scheduled For Today</p>
           {tableOcrLoading && <p>Running OCR...</p>}
           {tableOcrError && <p className="text-red-500">{tableOcrError}</p>}
           {(!tableOcrLoading && !tableOcrError && ocrTableEntries.length === 0) && <p>No trucks found for today.</p>}
           <div className="flex flex-col gap-1 pr-1">
           {Object.entries(ocrGrouped).map(([day, entries]) => {
              if (!entries.length) return null;
              return (
                <div key={day} className="border-1 my-2 p-2 rounded-lg border-foreground/10 bg-content3">
                  <p className="font-semibold capitalize text-foreground/70 mb-0.5">{day}</p>
                  <ul className="flex flex-col gap-1 space-y-0.5">
                    {entries.map(e=> {
           				// Match "Co"/"UCM Week of"
           				if (e.truck == "Co" || e.truck == "UCM Week of") {
           				  return null;
           				}
                      return (
                      <li key={`${e.truck}-${e.day}-${e.start}`} className={`flex  rounded-lg flex-col px-1 py-0.5 ${e.notes==='ocr-table' ? 'bg-content4/70 ' : 'bg-content4/20'}`}>
                        <span className="p-2 rounded font-medium flex items-center justify-between text-[14px]">{e.truck} {e.cuisine && <span className="text-foreground/40 text-[11px]">{e.cuisine}</span>} {e.notes==='ocr-table' && <span className="text-[11px] uppercase tracking-wide bg-primary/15 text-foreground dark:text-primary px-1 py-[1px] rounded">{to12h(e.start)} – {to12h(e.end)}{e.notes && e.notes!=='ocr-table'? ` • ${e.notes}`:''}</span>}</span>
                      </li>
                      );
                    })}
                  </ul>
                </div>
              )
            })}
           </div>
        </div>
      )}
      {tab==='image' && (
        <div className="flex flex-col gap-2 text-xs">
          <div className="flex gap-2">
            <select value={truckFilter} onChange={e=>setTruckFilter(e.target.value)} className="flex-1 bg-content2/40 border border-foreground/10 rounded px-1 py-0.5">
              <option value="all">All Trucks</option>
              {trucks.map(t=> <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={dayFilter} onChange={e=>setDayFilter(e.target.value)} className="w-20 bg-content2/40 border border-foreground/10 rounded px-1 py-0.5">
              <option value="all">All days</option>
              {daysOrder.map(d=> <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <p className="text-foreground/50">Week start: {weekStartForStructured}</p>
          <div className="flex flex-col gap-1 pr-1">
            {daysOrder.map(day=> {
              const entries = grouped[day] || [];
              if (!entries.length) return null;
              return (
                <div key={day} className="border border-foreground/10 rounded p-1 bg-content3/50">
                  <p className="font-semibold capitalize text-foreground/70 mb-0.5">{day}</p>
                  <ul className="space-y-0.5">
                    {entries.map(e=> {
           				if (e.truck == "Co" || e.truck == "UCM Week of") {
           				  return null;
           				}
                      return (
                      <li key={`${e.truck}-${e.day}-${e.start}`} className={`flex flex-col rounded px-1 py-0.5 ${e.notes==='ocr-table' ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-foreground/5'}`}>
                        <span className="font-medium flex items-center gap-1">{e.truck} {e.cuisine && <span className="text-foreground/40 text-[10px]">{e.cuisine}</span>} {e.notes==='ocr-table' && <span className="text-[8px] uppercase tracking-wide bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-1 py-[1px] rounded">ocr</span>}</span>
                        <span className="text-[10px] text-foreground/60">{to12h(e.start)} – {to12h(e.end)}{e.notes && e.notes!=='ocr-table'? ` • ${e.notes}`:''}</span>
                      </li>
                      );
                    })}
                  </ul>
                </div>
              )
            })}
            {!filteredEntries.length && <p className="text-foreground/40">No entries for selected filters.</p>}
          </div>
          <button
              ref={ocrBtnRef}
              onClick={runOcr}
              className="w-full text-[11px] mt-2 px-2 py-1 rounded bg-foreground/20 hover:bg-blue-500/30 dark:text-blue-400 transition disabled:opacity-40"
            >
              Reload Table
            </button>
            {tableOcrResult && tableOcrResult.length > 0 && (
              <div className="mt-4">
                <p className="font-semibold text-[10px] mb-1 flex items-center gap-2">
                  Table OCR Result <span className="text-foreground/40 font-normal">{tableOcrResult.length} rows</span>
                </p>
                <div className="max-h-60 overflow-y-auto border border-foreground/10 rounded"> {/* Added a container for scrolling */}
                  <table className="w-full table-auto border-collapse text-[9px]">
                    <thead className="sticky top-0 bg-content2/80 backdrop-blur-sm">
                      <tr>
                        {Object.keys(tableOcrResult[0] || {}).map(h => (
                          <th key={h} className="px-1 py-0.5 text-left font-semibold">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tableOcrResult.slice(0, 50).map((r, i) => (
                        <tr key={i} className="odd:bg-foreground/5">
                          {Object.keys(tableOcrResult[0]).map(h => (
                            <td key={h} className="px-1 py-0.5 align-top border-t border-foreground/5">
                              {r[h]}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
        <>
          {loading && <p className="text-xs text-foreground/40">Loading schedule…</p>}
          {error && <p className="text-xs text-red-500">Fetch failed; using fallback.</p>}
          {active ? (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-foreground/50">Week: {active.label}</p>
              <div className="rounded-lg overflow-hidden border border-foreground/10 bg-content3">
                <img src={active.url} alt={`Food truck schedule ${active.label}`} className="w-full h-auto object-cover" loading="lazy" />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2 text-xs">
              <p className="text-foreground/60">No schedule image mapped for this week yet.</p>
              <a className="underline text-blue-500" target="_blank" rel="noopener noreferrer" href="https://dining.ucmerced.edu/locations-hours/food-trucks">Official site</a>
            </div>
          )}
        </>
        </div>
      )}
      <div className="mt-3 p-2 rounded bg-foreground/5 text-[10px] leading-snug text-foreground/50">
        <p>Images are auto-fetched (hourly cache) from UC Merced website.</p>
      </div>
    </div>
  );
};

export default FoodTrucks;