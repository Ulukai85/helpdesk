import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";

export function renderWithQuery(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

export function renderWithRouter(
  ui: React.ReactElement,
  { initialEntry = "/" } = {},
) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>{ui}</MemoryRouter>,
  );
}
