import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// /api 는 FastAPI(localhost:8000)로 프록시 — 같은 출처로 보이므로 CORS 설정이 필요 없다.
const proxy = { '/api': 'http://localhost:8000' };

export default defineConfig({
  plugins: [react()],
  server: { proxy },
  preview: { proxy },
});
