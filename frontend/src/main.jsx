import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { GestanteProvider } from './context/GestanteContext';
import '@fontsource-variable/inter';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <GestanteProvider>
        <App />
      </GestanteProvider>
    </BrowserRouter>
  </React.StrictMode>
);
