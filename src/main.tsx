import {StrictMode} from 'react';
import { Analytics } from "@vercel/analytics/react";
// @ts-ignore: Missing type declarations for react-dom/client
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
<Analytics />