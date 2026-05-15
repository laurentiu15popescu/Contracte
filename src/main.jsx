import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { DialogProvider } from './shared/Dialog.jsx'
import AuthGate from './shared/AuthGate.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <DialogProvider>
      <AuthGate>
        <App />
      </AuthGate>
    </DialogProvider>
  </StrictMode>,
)
