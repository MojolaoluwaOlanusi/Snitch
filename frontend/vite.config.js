import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import './src/utils/snitchApiLogger.js';

export default defineConfig({
  plugins: [react()]
});
