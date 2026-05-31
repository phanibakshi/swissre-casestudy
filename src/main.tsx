import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '@/app/App'
import { Providers } from '@/app/providers'
import '@/assets/global.scss'

async function bootstrap() {
  if (import.meta.env.DEV || import.meta.env.VITE_ENABLE_MSW === 'true') {
    const { worker } = await import('@/mocks/browser')
    const base = import.meta.env.BASE_URL
    await worker.start({
      onUnhandledRequest: 'bypass',
      serviceWorker: {
        url: `${base}mockServiceWorker.js`,
        options: { scope: base },
      },
    })
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <Providers>
        <App />
      </Providers>
    </StrictMode>,
  )
}

bootstrap()
