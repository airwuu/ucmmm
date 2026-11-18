import { loadOpenCV, loadImage } from './foodtruck/runtime.js';
import { detectGrid, cropCell } from './foodtruck/grid.js';
import { parseTable, sortWeeks } from './foodtruck/parse.js';

const API_BASE = 'https://ucmmmdb.ucmmm-ucm.workers.dev';
export { loadOpenCV };

export async function fetchWeekImages() {
    const response = await fetch(`${API_BASE}/foodtrucks/images`);
    if (!response.ok) throw new Error(`Schedule image discovery failed (HTTP ${response.status}).`);
    const data = await response.json();
    if (!Array.isArray(data.weeks)) throw new Error('Schedule image discovery returned invalid data.');
    return sortWeeks(data.weeks);
}

export async function submitOcrResults(weekStart, entries, imageUrl, signal) {
    const response = await fetch(`${API_BASE}/foodtrucks/schedule`, {
        method: 'POST', signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ week_start: weekStart, entries, image_url: imageUrl }),
    });
    const result = await response.json();
    if (!response.ok || result.success === false || result.error) throw new Error('Schedule is available locally, but could not be saved.');
    return result;
}

export async function runOcr(imageUrl, onProgress = () => {}, { signal, directImage = false } = {}) {
    let worker;
    const check = () => signal?.throwIfAborted();
    try {
        onProgress(0.05, 'Loading image processing engine…');
        const cv = await loadOpenCV();
        check();
        onProgress(0.1, 'Loading schedule image…');
        const canvas = await loadImage(directImage ? imageUrl : `${API_BASE}/proxy/image?url=${encodeURIComponent(imageUrl)}`, signal);
        check();
        const { x, y } = detectGrid(cv, canvas);
        const { createWorker, PSM } = await import('tesseract.js');
        worker = await createWorker('eng');
        check();
        await worker.setParameters({ tessedit_pageseg_mode: PSM.SINGLE_BLOCK });
        const matrix = [];
        const count = (y.length - 1) * (x.length - 1);
        for (let row = 0; row < y.length - 1; row++) {
            const cells = [];
            for (let col = 0; col < x.length - 1; col++) {
                check();
                const index = row * (x.length - 1) + col;
                onProgress(0.2 + index / count * 0.75, `Reading cell ${index + 1}/${count}…`);
                const cell = cropCell(canvas, x[col], y[row], x[col + 1], y[row + 1]);
                const { data } = await worker.recognize(cell);
                cells.push(data.text.trim());
            }
            matrix.push(cells);
        }
        check();
        const result = parseTable(matrix);
        onProgress(1, 'Scan complete');
        return result;
    } finally { if (worker) await worker.terminate(); }
}
