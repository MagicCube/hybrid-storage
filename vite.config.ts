import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [tsconfigPaths()],
  server: {
    host: '0.0.0.0',
    https: true,
    open: 'https://localhost:3000/tests/index.html',
  },
});
