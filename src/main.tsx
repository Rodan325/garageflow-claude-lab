import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { injectSpeedInsights } from '@vercel/speed-insights'
import { App } from './App'
import { ThemeProvider } from '@/lib/theme'
import { ToastProvider } from '@/components/ui/toast'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { LanguageProvider } from '@/i18n'
import { BrandProvider } from '@/branding'
import { queryClient } from '@/lib/queryClient'
import './index.css'

// Initialize Vercel Speed Insights
injectSpeedInsights()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <BrandProvider>
        <ThemeProvider>
          <ToastProvider>
            <QueryClientProvider client={queryClient}>
              <AuthProvider>
                <HashRouter>
                  <App />
                </HashRouter>
              </AuthProvider>
            </QueryClientProvider>
          </ToastProvider>
        </ThemeProvider>
      </BrandProvider>
    </LanguageProvider>
  </StrictMode>,
)
