import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // Обов'язково!

export default defineConfig({
    plugins: [
        react(),
        tailwindcss(), // Додайте цей плагін сюди
    ],
})