/**
 * Food Truck OCR Utilities
 * Handles image processing and text extraction for food truck schedule
 */

const API_BASE = 'https://ucmmmdb.ucmmm-ucm.workers.dev';

/**
 * Dynamically load OpenCV.js
 */
export function loadOpenCV() {
    return new Promise((resolve, reject) => {
        if (typeof window === 'undefined') {
            reject(new Error('OpenCV only runs in browser'));
            return;
        }

        // Already loaded
        if (window.cv && window.cv.imread) {
            resolve(window.cv);
            return;
        }

        const existingScript = document.getElementById('opencv-js');
        if (existingScript) {
            // Wait for it to load
            const waitReady = () => {
                if (window.cv && window.cv.imread) {
                    resolve(window.cv);
                    return;
                }
                setTimeout(waitReady, 100);
            };
            waitReady();
            return;
        }

        const script = document.createElement('script');
        script.id = 'opencv-js';
        script.src = 'https://docs.opencv.org/4.x/opencv.js';
        script.async = true;

        script.onload = () => {
            const waitReady = () => {
                if (window.cv && window.cv.imread) {
                    resolve(window.cv);
                    return;
                }
                setTimeout(waitReady, 100);
            };
            waitReady();
        };

        script.onerror = () => reject(new Error('Failed to load OpenCV.js'));
        document.head.appendChild(script);
    });
}

/**
 * Fetch week images by scraping the dining website
 * Uses Vite proxy to bypass CORS
 */
export async function fetchWeekImages() {
    const SOURCE_URL = 'https://dining.ucmerced.edu/retail-services/fork-road';

    try {
        // Fetch via Vite proxy to bypass CORS
        let html = '';
        try {
            const proxyRes = await fetch('/proxy/dining');
            if (proxyRes.ok) {
                html = await proxyRes.text();
            }
        } catch (err) {
            console.warn('[OCR] Proxy fetch failed:', err);
        }

        if (!html) {
            console.log('[OCR] Could not fetch dining page');
            return [];
        }

        // Parse images from HTML
        const year = new Date().getFullYear();
        const weeks = [];
        const seen = new Set();

        // Pattern 1: Range format (month-day-month-day.png)
        const rangeRegex = /src="([^"]*?(\d{1,2})-(\d{1,2})-(\d{1,2})-(\d{1,2})\.png)"/g;
        let m;
        while ((m = rangeRegex.exec(html)) !== null) {
            const full = m[1];
            const sm = parseInt(m[2], 10);
            const sd = parseInt(m[3], 10);
            const em = parseInt(m[4], 10);
            const ed = parseInt(m[5], 10);
            if (seen.has(full)) continue;
            seen.add(full);

            const start = `${year}-${String(sm).padStart(2, '0')}-${String(sd).padStart(2, '0')}`;
            const end = `${year}-${String(em).padStart(2, '0')}-${String(ed).padStart(2, '0')}`;
            const url = full.startsWith('http') ? full : new URL(full, SOURCE_URL).toString();
            weeks.push({ url, start, end, label: `${sm}/${sd} - ${em}/${ed}` });
        }

        // Pattern 2: Single date format (month-day.png)
        const singleRegex = /src="([^"]*?\/page\/images\/(\d{1,2})-(\d{1,2})\.png)"/g;
        while ((m = singleRegex.exec(html)) !== null) {
            const full = m[1];
            if (full.includes('logo') || full.includes('icon')) continue;

            const sm = parseInt(m[2], 10);
            const sd = parseInt(m[3], 10);
            if (seen.has(full)) continue;
            seen.add(full);

            const startDate = new Date(year, sm - 1, sd);
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 6);

            const start = `${year}-${String(sm).padStart(2, '0')}-${String(sd).padStart(2, '0')}`;
            const end = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
            const url = full.startsWith('http') ? full : new URL(full, SOURCE_URL).toString();
            weeks.push({ url, start, end, label: `${sm}/${sd}` });
        }

        weeks.sort((a, b) => a.start.localeCompare(b.start));
        console.log('[OCR] Scraped weeks:', weeks.length, weeks);
        return weeks;
    } catch (err) {
        console.error('[OCR] fetchWeekImages error:', err);
        return [];
    }
}

/**
 * Submit OCR results to backend cache
 */
export async function submitOcrResults(weekStart, entries, imageUrl) {
    try {
        const res = await fetch(`${API_BASE}/foodtrucks/schedule`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                week_start: weekStart,
                entries: entries,
                image_url: imageUrl
            })
        });
        return await res.json();
    } catch (err) {
        console.error('[OCR] Submit failed:', err);
        return { success: false, inserted: 0, error: err.message };
    }
}

/**
 * Parse OCR text into structured entries
 * Table format: rows = location/time, columns = days
 */
function parseOcrTable(tableData, weekStart) {
    const entries = [];
    const canonicalDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    // Find location column and day columns
    const sample = tableData[0];
    if (!sample) return entries;

    const keys = Object.keys(sample);
    const locationKey = keys.find(k => /location/i.test(k)) || keys[0];

    // Map canonical days to actual column keys
    const dayKeyMap = {};
    for (const k of keys) {
        const norm = k.toLowerCase();
        for (const day of canonicalDays) {
            if (norm.includes(day.toLowerCase().slice(0, 3))) {
                dayKeyMap[day] = k;
                break;
            }
        }
    }

    // Parse time from location string
    function parseHours(src) {
        const m = src.match(/(\d{1,2})(?::(\d{2}))?\s?(am|pm)?\s?[-–]\s?(\d{1,2})(?::(\d{2}))?\s?(am|pm)?/i);
        if (!m) return null;

        const [, h1, mm1, ap1, h2, mm2, ap2] = m;

        function to24(hs, mm, ap, inheritAp) {
            let h = parseInt(hs, 10);
            const apUse = ap || inheritAp || '';
            if (apUse) {
                if (apUse.toLowerCase() === 'pm' && h !== 12) h += 12;
                if (apUse.toLowerCase() === 'am' && h === 12) h = 0;
            }
            return `${h.toString().padStart(2, '0')}:${mm || '00'}`;
        }

        return {
            start: to24(h1, mm1, ap1, ap2),
            end: to24(h2, mm2, ap2, ap1)
        };
    }

    function abbrev(day) {
        return day.slice(0, 3).toLowerCase();
    }

    // Process each row
    for (const row of tableData) {
        const locRaw = (row[locationKey] || '').trim();
        if (!locRaw) continue;

        const isNightService = /night service/i.test(locRaw);
        const hours = isNightService
            ? { start: 'Night Service', end: '' }
            : parseHours(locRaw) || { start: '10:00', end: '18:00' };

        for (const day of Object.keys(dayKeyMap)) {
            const cell = (row[dayKeyMap[day]] || '').trim();
            if (!cell || /^(closed|holiday)$/i.test(cell)) continue;

            const truck = cell.replace(/[^A-Za-z0-9&'()\-\s]/g, '').trim();
            if (!truck) continue;

            entries.push({
                day: abbrev(day),
                truck: truck,
                start: hours.start,
                end: hours.end
            });
        }
    }

    return entries;
}

/**
 * Run OCR on food truck schedule image
 * @param {string} imageUrl - URL of the schedule image
 * @param {function} onProgress - Progress callback (0-1, message)
 * @param {boolean} cvReady - Whether OpenCV is preloaded and ready
 */
export async function runOcr(imageUrl, onProgress = () => { }, cvReady = false) {
    console.log('[OCR] Starting OCR for:', imageUrl, 'cvReady:', cvReady);
    onProgress(0.05, 'Loading OCR engine...');

    // Import Tesseract dynamically
    const Tesseract = await import('tesseract.js');
    onProgress(0.1, 'Loading image...');

    // Try to load image via proxy first (for CORS)
    let imageTarget = imageUrl;
    try {
        const proxied = await fetch(`/proxy/image?url=${encodeURIComponent(imageUrl)}`);
        if (proxied.ok) {
            const blob = await proxied.blob();
            imageTarget = URL.createObjectURL(blob);
            console.log('[OCR] Using proxy image');
        }
    } catch (err) {
        console.warn('[OCR] Proxy failed, using direct URL', err);
    }

    onProgress(0.2, 'Processing image...');

    // If OpenCV is preloaded and ready, try grid detection
    if (cvReady && window.cv && window.cv.imread) {
        try {
            console.log('[OCR] Using OpenCV grid detection');
            const result = await runGridOcr(window.cv, Tesseract, imageTarget, onProgress);
            if (result && result.length > 0) {
                return result;
            }
        } catch (err) {
            console.warn('[OCR] Grid detection failed, falling back', err);
        }
    } else {
        console.log('[OCR] OpenCV not ready, using simple OCR');
    }

    // Fallback: Simple full-image OCR
    onProgress(0.5, 'Running text recognition...');
    const { data } = await Tesseract.recognize(imageTarget, 'eng');
    const text = data.text || '';

    onProgress(0.9, 'Parsing results...');

    // Try to parse as simple line-based table
    const lines = text.split(/\n+/).map(l => l.trim()).filter(l => l.length > 0);
    console.log('[OCR] Lines extracted:', lines.length);

    return { rawText: text, lines, parsed: [] };
}

/**
 * Run grid-based OCR using OpenCV for cell detection
 */
async function runGridOcr(cv, Tesseract, imageUrl, onProgress) {
    // Load image into canvas
    const imgEl = new Image();
    imgEl.crossOrigin = 'anonymous';
    await new Promise((res, rej) => {
        imgEl.onload = () => res();
        imgEl.onerror = () => rej(new Error('Image load failed'));
        imgEl.src = imageUrl;
    });

    const canvas = document.createElement('canvas');
    canvas.width = imgEl.width;
    canvas.height = imgEl.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imgEl, 0, 0);

    onProgress(0.25, 'Detecting grid...');

    // Convert to grayscale
    const src = cv.imread(canvas);
    const gray = new cv.Mat();
    if (src.channels() === 4) {
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    } else {
        src.copyTo(gray);
    }

    // Adaptive threshold
    const work = new cv.Mat();
    cv.adaptiveThreshold(gray, work, 255, cv.ADAPTIVE_THRESH_MEAN_C, cv.THRESH_BINARY_INV, 21, 10);

    // Detect horizontal lines
    const horiz = new cv.Mat();
    work.copyTo(horiz);
    const hSize = Math.max(10, Math.floor(work.cols / 30));
    const hKernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(hSize, 1));
    cv.erode(horiz, horiz, hKernel);
    cv.dilate(horiz, horiz, hKernel);

    // Detect vertical lines
    const vert = new cv.Mat();
    work.copyTo(vert);
    const vSize = Math.max(8, Math.floor(work.rows / 25));
    const vKernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(1, vSize));
    cv.erode(vert, vert, vKernel);
    cv.dilate(vert, vert, vKernel);

    // Find horizontal line positions
    const horizProfile = [];
    for (let y = 0; y < horiz.rows; y++) {
        let cnt = 0;
        for (let x = 0; x < horiz.cols; x++) {
            if (horiz.ucharPtr(y, x)[0] > 0) cnt++;
        }
        horizProfile.push(cnt);
    }

    const hThresh = horiz.cols * 0.5;
    let horizLines = [];
    for (let y = 0; y < horizProfile.length; y++) {
        if (horizProfile[y] > hThresh) horizLines.push(y);
    }

    // Collapse clusters
    const collapse = (arr) => {
        const out = [];
        let i = 0;
        while (i < arr.length) {
            let j = i;
            while (j + 1 < arr.length && arr[j + 1] - arr[j] < 4) j++;
            out.push(Math.round((arr[i] + arr[j]) / 2));
            i = j + 1;
        }
        return out;
    };

    horizLines = collapse(horizLines);
    if (horizLines[0] !== 0) horizLines.unshift(0);
    if (horizLines[horizLines.length - 1] !== work.rows - 1) horizLines.push(work.rows - 1);

    // Find vertical line positions
    const vertProfile = [];
    for (let x = 0; x < vert.cols; x++) {
        let cnt = 0;
        for (let y = 0; y < vert.rows; y++) {
            if (vert.ucharPtr(y, x)[0] > 0) cnt++;
        }
        vertProfile.push(cnt);
    }

    const vThresh = vert.rows * 0.5;
    let vertLines = [];
    for (let x = 0; x < vertProfile.length; x++) {
        if (vertProfile[x] > vThresh) vertLines.push(x);
    }

    vertLines = collapse(vertLines);
    if (vertLines[0] !== 0) vertLines.unshift(0);
    if (vertLines[vertLines.length - 1] !== work.cols - 1) vertLines.push(work.cols - 1);

    console.log('[OCR] Grid detected:', horizLines.length, 'rows,', vertLines.length, 'cols');

    // Need at least 3 rows (header + 2 data) and 5 cols (location + days)
    if (horizLines.length < 3 || vertLines.length < 5) {
        // Cleanup
        src.delete(); gray.delete(); work.delete();
        horiz.delete(); vert.delete();
        hKernel.delete(); vKernel.delete();
        return null;
    }

    onProgress(0.35, 'Reading cells...');

    // Build cell boxes
    const cellBoxes = [];
    for (let r = 0; r < horizLines.length - 1; r++) {
        const y0 = horizLines[r];
        const y1 = horizLines[r + 1];
        if (y1 - y0 < 12) continue;

        for (let c = 0; c < vertLines.length - 1; c++) {
            const x0 = vertLines[c];
            const x1 = vertLines[c + 1];
            if (x1 - x0 < 12) continue;

            cellBoxes.push({ r, c, x: x0, y: y0, w: x1 - x0, h: y1 - y0 });
        }
    }

    // OCR each cell
    const rowsCount = horizLines.length - 1;
    const colsCount = vertLines.length - 1;
    const tableMatrix = Array.from({ length: rowsCount }, () => Array(colsCount).fill(''));

    let worker = null;
    try {
        if (Tesseract.createWorker) {
            worker = await Tesseract.createWorker('eng');
        }
    } catch (err) {
        console.warn('[OCR] Worker creation failed', err);
    }

    for (let i = 0; i < cellBoxes.length; i++) {
        const box = cellBoxes[i];
        onProgress(0.35 + (i / cellBoxes.length) * 0.45, `Reading cell ${i + 1}/${cellBoxes.length}...`);

        try {
            const cellCanvas = document.createElement('canvas');
            cellCanvas.width = box.w;
            cellCanvas.height = box.h;
            const cctx = cellCanvas.getContext('2d');
            cctx.drawImage(canvas, box.x, box.y, box.w, box.h, 0, 0, box.w, box.h);

            const dataUrl = cellCanvas.toDataURL('image/png');
            let cellText = '';

            try {
                if (worker) {
                    const { data } = await worker.recognize(dataUrl);
                    cellText = (data.text || '').trim();
                } else {
                    const { data } = await Tesseract.recognize(dataUrl, 'eng');
                    cellText = (data.text || '').trim();
                }
            } catch (err) {
                console.warn('[OCR] Cell recognition failed', err);
            }

            tableMatrix[box.r][box.c] = cellText.replace(/\s+/g, ' ');
        } catch (err) {
            console.warn('[OCR] Cell error', err);
        }
    }

    if (worker) {
        try { await worker.terminate(); } catch { }
    }

    // Cleanup OpenCV mats
    src.delete(); gray.delete(); work.delete();
    horiz.delete(); vert.delete();
    hKernel.delete(); vKernel.delete();

    onProgress(0.85, 'Parsing table...');

    // Find header row with day names
    const canonicalDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const fuzzyDay = (tok) => {
        const norm = tok.toLowerCase().replace(/[^a-z]/g, '');
        for (const d of canonicalDays) {
            if (norm.includes(d.toLowerCase().slice(0, 3))) return d;
        }
        return null;
    };

    let headerRowIndex = 0;
    let headerCells = tableMatrix[0];
    for (let r = 0; r < tableMatrix.length; r++) {
        const cells = tableMatrix[r];
        const score = cells.reduce((acc, c) => acc + (fuzzyDay(c) ? 1 : 0), 0);
        if (score >= 3) {
            headerRowIndex = r;
            headerCells = cells;
            break;
        }
    }

    // Build day column mapping
    const hasDayCell = headerCells.some(c => fuzzyDay(c));
    const dayIndexMap = {};

    if (hasDayCell) {
        for (let c = 0; c < headerCells.length; c++) {
            const d = fuzzyDay(headerCells[c]);
            if (d && dayIndexMap[d] === undefined) {
                dayIndexMap[d] = c;
            }
        }
    }

    // Build result rows
    const rows = [];
    for (let r = 0; r < tableMatrix.length; r++) {
        if (r === headerRowIndex) continue;
        const cells = tableMatrix[r];
        if (cells.every(c => !c)) continue;

        const obj = {};
        if (hasDayCell) {
            const firstDayCol = Math.min(...Object.values(dayIndexMap));
            const locCells = cells.slice(0, firstDayCol).filter(Boolean);
            obj['Location'] = locCells.join(' ').trim();

            for (const day of canonicalDays) {
                const idx = dayIndexMap[day];
                if (idx != null) obj[day] = cells[idx] || '';
            }
        } else {
            headerCells.forEach((h, i) => {
                obj[h || `Col${i + 1}`] = cells[i] || '';
            });
        }

        rows.push(obj);
    }

    // Filter empty location rows
    const filteredRows = rows.filter(r => r.Location && r.Location.length > 2);

    console.log('[OCR] Parsed', filteredRows.length, 'rows');
    onProgress(0.95, 'Done!');

    return filteredRows;
}

export { parseOcrTable };
