// Einstiegspunkt: rendert die App in das div#root aus index.html
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* BrowserRouter ermöglicht die Navigation zwischen den Seiten ohne Neuladen */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
