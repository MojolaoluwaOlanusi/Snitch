import { defineConfig } from 'vite'
// @ts-ignore
import react from '@vitejs/plugin-react'          // keep this as is
import * as path from 'path'                        // ✅ star import instead of default
import { visualizer } from 'rollup-plugin-visualizer'
import compression from 'vite-plugin-compression'

// Custom plugin to load CSS asynchronously
function asyncCssPlugin() {
    return {
        name: 'async-css',
        enforce: 'post',
        transformIndexHtml(html) {
            return html.replace(
                /<link rel="stylesheet"[^>]*href="(\/assets\/index[^"]+)\.css"[^>]*>/,
                `<script>(function(){const l=document.createElement('link');l.rel='stylesheet';l.href="$1.css";l.media='print';l.onload=function(){l.media='all'};document.head.appendChild(l)})()</script>`
            );
        },
    };
}

export default defineConfig({
    plugins: [
        react(),
        visualizer({
            open: true,
            filename: 'stats.html',
            gzipSize: true,
            brotliSize: true,
        }),
        compression({ algorithm: 'brotliCompress' }),
        asyncCssPlugin(),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
        },
    },
    server: {
        port: 3000,
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks(id) {
                    // Keep each heavy library in its own chunk
                    if (id.includes('node_modules/react-virtuoso')) {
                        return 'react-virtuoso';
                    }
                    if (id.includes('node_modules/framer-motion')) {
                        return 'framer-motion';
                    }
                    // Group core React libraries together so they stay shareable
                    if (
                        id.includes('node_modules/react/') ||
                        id.includes('node_modules/react-dom/') ||
                        id.includes('node_modules/scheduler/')
                    ) {
                        return 'react-core';
                    }
                    if (id.includes('node_modules/axios/')) return 'axios';
                },
            },
        },
    },
})