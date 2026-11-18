let cvPromise;

export function loadOpenCV() {
    if (cvPromise) return cvPromise;
    cvPromise = new Promise((resolve, reject) => {
        let script = document.getElementById('opencv-js');
        let timer;
        let polling;
        let finished = false;
        const finish = (error, cv) => {
            if (finished) return;
            finished = true;
            clearTimeout(timer);
            clearTimeout(polling);
            if (script) script.onerror = null;
            if (error) {
                script?.remove();
                reject(error);
            } else resolve(cv);
        };
        const check = async () => {
            try {
                const cv = await window.cv;
                if (finished) return;
                if (cv?.Mat && cv?.imread) return finish(null, cv);
                polling = setTimeout(check, 100);
            } catch (error) { finish(error); }
        };
        timer = setTimeout(() => finish(new Error('Image processing engine timed out. Please retry.')), 30000);
        if (!script && !window.cv) {
            script = document.createElement('script');
            script.id = 'opencv-js';
            script.src = 'https://docs.opencv.org/4.x/opencv.js';
            script.async = true;
            document.head.appendChild(script);
        }
        if (script) script.onerror = () => finish(new Error('Could not load the image processing engine. Please retry.'));
        check();
    }).catch(error => {
        cvPromise = undefined;
        // A failed script may have left an incomplete module behind.
        if (!window.cv?.imread) window.cv = undefined;
        throw error;
    });
    return cvPromise;
}

export async function loadImage(url, signal) {
    const response = await fetch(url, { signal });
    if (!response.ok) throw new Error(`Schedule image unavailable (HTTP ${response.status}). Please retry or view the official source.`);
    if (!response.headers.get('content-type')?.startsWith('image/')) throw new Error('The image service did not return an image.');
    const blob = await response.blob();
    const bitmap = await createImageBitmap(blob);
    try {
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        canvas.getContext('2d').drawImage(bitmap, 0, 0);
        return canvas;
    } finally { bitmap.close(); }
}
