import React from 'react';
import ReactDOM from 'react-dom/client';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { appTheme } from '@mfe/ui-kit';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import RemoteApp from './RemoteApp';
import { getRoutes } from './routes';
import './styles.css';

const routes = getRoutes();
const homePath = routes[0]?.path ?? '/accounts';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path={homePath} element={<RemoteApp />} />
          <Route path="*" element={<Navigate to={homePath} replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);
