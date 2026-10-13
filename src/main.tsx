import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { AppStoreProvider } from './store/AppStore';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AppStoreProvider>
        <App />
      </AppStoreProvider>
    </ErrorBoundary>
  </StrictMode>,
);
