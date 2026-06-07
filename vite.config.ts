import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// The React + Tailwind frontend lives in web/ and builds to web/dist,
// which the CDK stack uploads to S3 (see lib/vttu-stack.ts).
export default defineConfig({
  root: 'web',
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});
