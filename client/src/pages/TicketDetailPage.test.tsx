import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router';
import axios from 'axios';
import TicketDetailPage from './TicketDetailPage';
import { type TicketDetail, TicketStatus, TicketCategory } from '@helpdesk/core';

vi.mock('axios');
const mockedAxios = vi.mocked(axios);

const mockAgents = [
  { id: 'agent-1', name: 'Alice Agent' },
  { id: 'agent-2', name: 'Bob Agent' },
];

const mockTicketBase: TicketDetail = {
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

function mockGet(ticket = mockTicketBase, agents = mockAgents) {
  mockedAxios.get = vi.fn().mockImplementation((url: string) => {
    if (url.includes('/api/tickets/'))
      return Promise.resolve({ data: { ticket } });
    return Promise.resolve({ data: { agents } });
  });
}

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
      if (url.includes('/api/tickets/'))
        return Promise.reject(new Error('Network Error'));
      return Promise.resolve({ data: { agents: mockAgents } });
    });

    renderPage();

    await waitFor(() =>
      expect(screen.getByText('Network Error')).toBeInTheDocument(),
    );
  });

  it('renders ticket subject and metadata', async () => {
    mockGet();
    renderPage();

    await waitFor(() =>
      expect(screen.getByText('My printer is on fire')).toBeInTheDocument(),
    );
    expect(screen.getByText(/#42/)).toBeInTheDocument();
  });

  it('renders customer name and email', async () => {
    mockGet();
    renderPage();

    await waitFor(() =>
      expect(screen.getByText('Carol Customer')).toBeInTheDocument(),
    );
    expect(screen.getByText('carol@example.com')).toBeInTheDocument();
  });

  it('renders current status in the Status select', async () => {
    mockGet();
    renderPage();

    await waitFor(() =>
      expect(screen.getByRole('combobox', { name: /status/i })).toBeInTheDocument(),
    );
    expect(screen.getByRole('combobox', { name: /status/i })).toHaveTextContent(
      TicketStatus.OPEN,
    );
  });

  it('renders current category label in the Category select', async () => {
    mockGet();
    renderPage();

    await waitFor(() =>
      expect(
        screen.getByRole('combobox', { name: /category/i }),
      ).toBeInTheDocument(),
    );
    expect(
      screen.getByRole('combobox', { name: /category/i }),
    ).toHaveTextContent('Technical Question');
  });

  it('shows "Uncategorized" in the Category select when category is null', async () => {
    mockGet({ ...mockTicketBase, category: null });
    renderPage();

    await waitFor(() =>
      expect(
        screen.getByRole('combobox', { name: /category/i }),
      ).toHaveTextContent('Uncategorized'),
    );
  });

  it('renders the ticket body text', async () => {
    mockGet();
    renderPage();

    await waitFor(() =>
      expect(
        screen.getByText('It started smoking and then burst into flames.'),
      ).toBeInTheDocument(),
    );
  });

  it('shows "Unassigned" in the Assigned to select when no agent is assigned', async () => {
    mockGet();
    renderPage();

    await waitFor(() =>
      expect(
        screen.getByRole('combobox', { name: /assigned to/i }),
      ).toHaveTextContent('Unassigned'),
    );
  });

  it('shows the assigned agent name in the Assigned to select', async () => {
    mockGet({
      ...mockTicketBase,
      assignedTo: { id: 'agent-1', name: 'Alice Agent' },
    });
    renderPage();

    await waitFor(() =>
      expect(
        screen.getByRole('combobox', { name: /assigned to/i }),
      ).toHaveTextContent('Alice Agent'),
    );
  });

  it('calls GET /api/tickets/:id and GET /api/agents with credentials', async () => {
    mockGet();
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

  it('calls PATCH with the new status when the Status select changes', async () => {
    const user = userEvent.setup();
    mockGet();
    mockedAxios.patch = vi.fn().mockResolvedValue({});

    renderPage('42');

    await waitFor(() =>
      expect(screen.getByRole('combobox', { name: /status/i })).toBeInTheDocument(),
    );

    await user.click(screen.getByRole('combobox', { name: /status/i }));

    await waitFor(() =>
      expect(screen.getByText(TicketStatus.RESOLVED)).toBeInTheDocument(),
    );

    await user.click(screen.getByText(TicketStatus.RESOLVED));

    await waitFor(() =>
      expect(mockedAxios.patch).toHaveBeenCalledWith(
        '/api/tickets/42',
        { status: TicketStatus.RESOLVED },
        { withCredentials: true },
      ),
    );
  });

  it('calls PATCH with the new category when the Category select changes', async () => {
    const user = userEvent.setup();
    mockGet();
    mockedAxios.patch = vi.fn().mockResolvedValue({});

    renderPage('42');

    await waitFor(() =>
      expect(screen.getByRole('combobox', { name: /category/i })).toBeInTheDocument(),
    );

    await user.click(screen.getByRole('combobox', { name: /category/i }));

    await waitFor(() =>
      expect(screen.getByText('Refund Request')).toBeInTheDocument(),
    );

    await user.click(screen.getByText('Refund Request'));

    await waitFor(() =>
      expect(mockedAxios.patch).toHaveBeenCalledWith(
        '/api/tickets/42',
        { category: TicketCategory.REFUND_REQUEST },
        { withCredentials: true },
      ),
    );
  });

  it('calls PATCH with null category when "Uncategorized" is selected', async () => {
    const user = userEvent.setup();
    mockGet();
    mockedAxios.patch = vi.fn().mockResolvedValue({});

    renderPage('42');

    await waitFor(() =>
      expect(screen.getByRole('combobox', { name: /category/i })).toBeInTheDocument(),
    );

    await user.click(screen.getByRole('combobox', { name: /category/i }));

    await waitFor(() =>
      expect(screen.getAllByText('Uncategorized').length).toBeGreaterThan(0),
    );

    await user.click(screen.getAllByText('Uncategorized')[0]);

    await waitFor(() =>
      expect(mockedAxios.patch).toHaveBeenCalledWith(
        '/api/tickets/42',
        { category: null },
        { withCredentials: true },
      ),
    );
  });

  it('calls PATCH with the selected agent id when the Assigned to select changes', async () => {
    const user = userEvent.setup();
    mockGet();
    mockedAxios.patch = vi.fn().mockResolvedValue({});

    renderPage('42');

    await waitFor(() =>
      expect(
        screen.getByRole('combobox', { name: /assigned to/i }),
      ).toBeInTheDocument(),
    );

    await user.click(screen.getByRole('combobox', { name: /assigned to/i }));

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
    mockGet({
      ...mockTicketBase,
      assignedTo: { id: 'agent-1', name: 'Alice Agent' },
    });
    mockedAxios.patch = vi.fn().mockResolvedValue({});

    renderPage('42');

    await waitFor(() =>
      expect(
        screen.getByRole('combobox', { name: /assigned to/i }),
      ).toHaveTextContent('Alice Agent'),
    );

    await user.click(screen.getByRole('combobox', { name: /assigned to/i }));

    await waitFor(() =>
      expect(screen.getByText('Unassigned')).toBeInTheDocument(),
    );

    await user.click(screen.getByText('Unassigned'));

    await waitFor(() =>
      expect(mockedAxios.patch).toHaveBeenCalledWith(
        '/api/tickets/42',
        { assignedToId: null },
        { withCredentials: true },
      ),
    );
  });
});
