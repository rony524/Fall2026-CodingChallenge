// Vite build/dev-server configuration for the client.
// The React plugin adds JSX support and fast refresh (edits appear without a full reload).
// Start the dev server with `npm run dev` from the client/ folder (http://localhost:5173).
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
})
