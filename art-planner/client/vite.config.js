import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
    ],
    build: {
        chunkSizeWarningLimit: 1000,
    },
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './src/setupTests.js',
    },
});