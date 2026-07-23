import * as Sentry from "@sentry/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import axios from "axios";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import App from "./App";
import ErrorFallback from "./components/ErrorFallback";
import "./index.css";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Client errors (4xx) won't succeed on retry — only retry network/server errors.
      retry: (failureCount, error) =>
        !(axios.isAxiosError(error) && (error.response?.status ?? 500) < 500) &&
        failureCount < 3,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={ErrorFallback}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </Sentry.ErrorBoundary>
  </StrictMode>
);
