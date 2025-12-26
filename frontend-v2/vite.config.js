import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    server: {
        port: 3001,
        proxy: {
            // Proxy for scraping dining website (bypasses CORS)
            '/proxy/dining': {
                target: 'https://dining.ucmerced.edu',
                changeOrigin: true,
                rewrite: (path) => '/retail-services/fork-road',
            },
            // Proxy for fetching schedule images
            '/proxy/image': {
                target: 'https://dining.ucmerced.edu',
                changeOrigin: true,
                rewrite: (path) => {
                    const url = new URL(path, 'http://localhost');
                    const imageUrl = url.searchParams.get('url');
                    if (imageUrl) {
                        try {
                            const parsed = new URL(imageUrl);
                            return parsed.pathname;
                        } catch {
                            return path;
                        }
                    }
                    return path;
                },
            },
        },
    },
})
