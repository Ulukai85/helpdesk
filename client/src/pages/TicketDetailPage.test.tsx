import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router';
import axios from 'axios';
import TicketDetailPage from './TicketDetailPage';
import { TicketStatus, TicketCategory } from '@helpdesk/core';

vi.mock('axios');
const mockedAxios = vi.mocked(axios);

const mockAgents = [
  { id: 'agent-1', name: 'Alice Agent' },
  { id: 'agent-2', name: 'Bob Agent' },
];

const mockTicketBase = {
  id: 42,
  subject: 'My printer is on fire',
  body: 'It started smoking and then burst into flames.',
  bodyHtml: null,
  customerName: 'Carol Customer',
  customerEmail: 'carol@example.com',
  status: TicketStatus.OPEN,
  category: TicketCategory.TECHNICAL_QUESTION,
  assignedTo: null,
  createdAt: '2024-06-01T10:00:00.000Z',
  updatedAt: '2024-06-02T12:00:00.000Z',
};

function renderPage(ticketId = '42') {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[`/tickets/${ticketId}`]}>
        <Routes>
          <Route path='/tickets/:id' element={<TicketDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe('TicketDetailPage', () => {
  it('shows skeleton rows while loading', () => {
    mockedAxios.get = vi.fn(() => new Promise(() => {}));

    renderPage();

    const skeletons = document.querySelectorAll("[data-slot='skeleton']");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows an error message when the ticket request fails', async () => {
    mockedAxios.get = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/tickets/')) return Promise.reject(new Error('Network Error'));
      return Promise.resolve({ data: { agents: mockAgents } });
    });

    renderPage();

    await waitFor(() =>
      expect(screen.getByText('Network Error')).toBeInTheDocument(),
    );
  });

  it('renders ticket subject and metadata', async () => {
    mockedAxios.get = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/tickets/')) return Promise.resolve({ data: { ticket: mockTicketBase } });
      return Promise.resolve({ data: { agents: mockAgents } });
    });

    renderPage();

    await waitFor(() =>
      expect(screen.getByText('My printer is on fire')).toBeInTheDocument(),
    );
    expect(screen.getByText(/#42/)).toBeInTheDocument();
  });

  it('renders customer name and email', async () => {
    mockedAxios.get = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/tickets/')) return Promise.resolve({ data: { ticket: mockTicketBase } });
      return Promise.resolve({ data: { agents: mockAgents } });
    });

    renderPage();

    await waitFor(() =>
      expect(screen.getByText('Carol Customer')).toBeInTheDocument(),
    );
    expect(screen.getByText('carol@example.com')).toBeInTheDocument();
  });

  it('renders status and category badges', async () => {
    mockedAxios.get = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/tickets/')) return Promise.resolve({ data: { ticket: mockTicketBase } });
      return Promise.resolve({ data: { agents: mockAgents } });
    });

    renderPage();

    await waitFor(() =>
      expect(screen.getByText(TicketStatus.OPEN)).toBeInTheDocument(),
    );
    expect(screen.getByText('Technical Question')).toBeInTheDocument();
  });

  it('renders the ticket body text', async () => {
    mockedAxios.get = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/tickets/')) return Promise.resolve({ data: { ticket: mockTicketBase } });
      return Promise.resolve({ data: { agents: mockAgents } });
    });

    renderPage();

    await waitFor(() =>
      expect(
        screen.getByText('It started smoking and then burst into flames.'),
      ).toBeInTheDocument(),
    );
  });

  it('shows "Unassigned" when no agent is assigned', async () => {
    mockedAxios.get = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/tickets/')) return Promise.resolve({ data: { ticket: mockTicketBase } });
      return Promise.resolve({ data: { agents: mockAgents } });
    });

    renderPage();

    await waitFor(() =>
      expect(screen.getByText('Unassigned')).toBeInTheDocument(),
    );
  });

  it('shows the assigned agent name when the ticket has an assignee', async () => {
    const assigned = { ...mockTicketBase, assignedTo: { id: 'agent-1', name: 'Alice Agent' } };
    mockedAxios.get = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/tickets/')) return Promise.resolve({ data: { ticket: assigned } });
      return Promise.resolve({ data: { agents: mockAgents } });
    });

    renderPage();

    await waitFor(() =>
      expect(screen.getByText('Alice Agent')).toBeInTheDocument(),
    );
  });

  it('calls GET /api/tickets/:id and GET /api/agents with credentials', async () => {
    mockedAxios.get = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/tickets/')) return Promise.resolve({ data: { ticket: mockTicketBase } });
      return Promise.resolve({ data: { agents: mockAgents } });
    });

    renderPage('42');

    await waitFor(() =>
      expect(screen.getByText('My printer is on fire')).toBeInTheDocument(),
    );

    expect(mockedAxios.get).toHaveBeenCalledWith('/api/tickets/42', {
      withCredentials: true,
    });
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/agents', {
      withCredentials: true,
    });
  });

  it('calls PATCH /api/tickets/:id with the selected agent id', async () => {
    const user = userEvent.setup();
    mockedAxios.get = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/tickets/')) return Promise.resolve({ data: { ticket: mockTicketBase } });
      return Promise.resolve({ data: { agents: mockAgents } });
    });
    mockedAxios.patch = vi.fn().mockResolvedValue({});

    renderPage('42');

    await waitFor(() =>
      expect(screen.getByText('Unassigned')).toBeInTheDocument(),
    );

    await user.click(screen.getByRole('combobox'));

    await waitFor(() =>
      expect(screen.getByText('Alice Agent')).toBeInTheDocument(),
    );

    await user.click(screen.getByText('Alice Agent'));

    await waitFor(() =>
      expect(mockedAxios.patch).toHaveBeenCalledWith(
        '/api/tickets/42',
        { assignedToId: 'agent-1' },
        { withCredentials: true },
      ),
    );
  });

  it('calls PATCH with null when "Unassigned" is selected', async () => {
    const user = userEvent.setup();
    const assigned = { ...mockTicketBase, assignedTo: { id: 'agent-1', name: 'Alice Agent' } };
    mockedAxios.get = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/tickets/')) return Promise.resolve({ data: { ticket: assigned } });
      return Promise.resolve({ data: { agents: mockAgents } });
    });
    mockedAxios.patch = vi.fn().mockResolvedValue({});

    renderPage('42');

    await waitFor(() =>
      expect(screen.getByText('Alice Agent')).toBeInTheDocument(),
    );

    await user.click(screen.getByRole('combobox'));

    await waitFor(() =>
      expect(screen.getAllByText('Unassigned').length).toBeGreaterThan(0),
    );

    await user.click(screen.getAllByText('Unassigned')[0]);

    await waitFor(() =>
      expect(mockedAxios.patch).toHaveBeenCalledWith(
        '/api/tickets/42',
        { assignedToId: null },
        { withCredentials: true },
      ),
    );
  });
});
