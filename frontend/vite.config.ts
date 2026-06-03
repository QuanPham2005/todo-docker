import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://backend:3000', // ← phải là "backend" (tên service Docker), không phải localhost
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''), // bỏ /api trước khi gửi đến NestJS
      },
    },
  },
});
