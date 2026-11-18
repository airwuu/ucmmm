export function collapseLines(profile, threshold) {
    const lines = [];
    for (let i = 0; i < profile.length; i++) {
        if (profile[i] < threshold) continue;
        const first = i;
        while (i + 1 < profile.length && profile[i + 1] >= threshold) i++;
        lines.push(Math.round((first + i) / 2));
    }
    return lines;
}

export function detectGrid(cv, canvas) {
    const resources = [];
    const keep = mat => { resources.push(mat); return mat; };
    try {
        const src = keep(cv.imread(canvas));
        const gray = keep(new cv.Mat());
        const binary = keep(new cv.Mat());
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
        cv.threshold(gray, binary, 100, 255, cv.THRESH_BINARY_INV);
        const positions = horizontal => {
            const lines = keep(new cv.Mat());
            const kernel = keep(cv.getStructuringElement(cv.MORPH_RECT,
                new cv.Size(horizontal ? Math.floor(canvas.width / 12) : 1, horizontal ? 1 : Math.floor(canvas.height / 5))));
            cv.morphologyEx(binary, lines, cv.MORPH_OPEN, kernel);
            const length = horizontal ? lines.rows : lines.cols;
            const breadth = horizontal ? lines.cols : lines.rows;
            const profile = Array(length).fill(0);
            for (let i = 0; i < length; i++) {
                for (let j = 0; j < breadth; j++) {
                    if (lines.ucharPtr(horizontal ? i : j, horizontal ? j : i)[0]) profile[i]++;
                }
            }
            return collapseLines(profile, breadth * 0.65);
        };
        const x = positions(false);
        const y = positions(true);
        if (x.length !== 9 || y.length < 3) throw new Error('Could not detect the seven-day schedule grid.');
        return { x, y };
    } finally { resources.reverse().forEach(mat => mat.delete()); }
}

export function cropCell(canvas, left, top, right, bottom) {
    const inset = 2;
    const width = right - left - inset * 2;
    const height = bottom - top - inset * 2;
    if (width < 5 || height < 5) throw new Error('Schedule cells are too small to read.');
    const scale = 3;
    const padding = 12;
    const cell = document.createElement('canvas');
    cell.width = width * scale + padding * 2;
    cell.height = height * scale + padding * 2;
    const ctx = cell.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, cell.width, cell.height);
    ctx.drawImage(canvas, left + inset, top + inset, width, height, padding, padding, width * scale, height * scale);
    return cell;
}
