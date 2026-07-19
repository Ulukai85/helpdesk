import { screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import axios from 'axios';
import TicketsPerDayChart from './TicketsPerDayChart';
import { renderWithQuery } from '@/test/render-with-query';

vi.mock('axios');
const mockedAxios = vi.mocked(axios);

const mockStats = {
  totalTickets: 106,
  openTickets: 61,
  aiResolvedTickets: 2,
  aiResolvedPercentage: 1.9,
  averageResolutionTimeMs: null,
  ticketsPerDay: [
    { date: '2026-07-17', count: 3 },
    { date: '2026-07-18', count: 5 },
    { date: '2026-07-19', count: 2 },
  ],
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe('TicketsPerDayChart', () => {
  it('renders the title and description', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: { stats: mockStats } });

    renderWithQuery(<TicketsPerDayChart />);

    expect(screen.getByText('Tickets per Day')).toBeInTheDocument();
    expect(screen.getByText('Last 30 days')).toBeInTheDocument();
  });

  it('shows a skeleton while loading', () => {
    mockedAxios.get = vi.fn(() => new Promise(() => {}));

    renderWithQuery(<TicketsPerDayChart />);

    expect(document.querySelector("[data-slot='skeleton']")).toBeInTheDocument();
  });

  it('shows an error message when the request fails', async () => {
    mockedAxios.get = vi.fn().mockRejectedValue(new Error('Network Error'));

    renderWithQuery(<TicketsPerDayChart />);

    await waitFor(() =>
      expect(screen.getByText('Failed to load chart data.')).toBeInTheDocument(),
    );
  });

  it('renders a bar per day once data loads', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: { stats: mockStats } });

    renderWithQuery(<TicketsPerDayChart />);

    await waitFor(() =>
      expect(document.querySelectorAll('.recharts-bar-rectangle').length).toBe(
        mockStats.ticketsPerDay.length,
      ),
    );
  });

  it('calls the stats endpoint with credentials', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: { stats: mockStats } });

    renderWithQuery(<TicketsPerDayChart />);

    await waitFor(() =>
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/tickets/stats', {
        withCredentials: true,
      }),
    );
  });
});
