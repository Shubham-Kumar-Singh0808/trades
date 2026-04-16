import '@fontsource/poppins/400.css';
import '@fontsource/poppins/700.css';
import '@fontsource/plus-jakarta-sans/400.css';
import '@fontsource/plus-jakarta-sans/600.css';
import { CssBaseline, ThemeProvider } from '@mui/material';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import Loader from './components/Loader';
import Toast from './components/Toast';
import { LoaderProvider, useLoader } from './context/LoaderContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { DeleteConfirmProvider } from './context/DeleteConfirmContext';
import { setLoaderContext, setToastContext } from './api/client';
import theme from './theme';

// Wrapper component to initialize contexts
const ContextInitializer = () => {
  const loaderContext = useLoader();
  const toastContext = useToast();

  React.useEffect(() => {
    setLoaderContext(loaderContext);
    setToastContext(toastContext);
  }, [loaderContext, toastContext]);

  return (
    <>
      <Loader />
      <Toast />
      <App />
    </>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <LoaderProvider>
          <ToastProvider>
            <DeleteConfirmProvider>
              <ContextInitializer />
            </DeleteConfirmProvider>
          </ToastProvider>
        </LoaderProvider>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);
