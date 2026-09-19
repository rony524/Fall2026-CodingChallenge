/**
 * App entry point: the script index.html loads. It mounts the React app into the
 * <div id="root"> element from index.html.
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './App.tsx'

// StrictMode is a development-only helper: it deliberately runs effects twice and
// re-renders components to expose bugs early. It does nothing in a production build.
// The `!` tells TypeScript that #root exists in index.html.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
