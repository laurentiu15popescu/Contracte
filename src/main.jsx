import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import './index.css'
import App from './App.jsx'
import { DialogProvider } from './shared/Dialog.jsx'
import AuthGate from './shared/AuthGate.jsx'

// Monitorizare erori — activă doar dacă VITE_SENTRY_DSN e setat (altfel inert)
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1,
    replaysOnErrorSampleRate: 0,
    replaysSessionSampleRate: 0,
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<p style={{ padding: 24 }}>A apărut o eroare. Reîncarcă pagina.</p>}>
      <DialogProvider>
        <AuthGate>
          <App />
        </AuthGate>
      </DialogProvider>
    </Sentry.ErrorBoundary>
  </StrictMode>,
)
