import { screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import axios from 'axios';
import DashboardStats from './DashboardStats';
import { renderWithQuery } from '@/test/render-with-query';

vi.mock('axios');
const mockedAxios = vi.mocked(axios);

const mockStats = {
  totalTickets: 106,
  openTickets: 61,
  aiResolvedTickets: 2,
  aiResolvedPercentage: 1.8867924528301887,
  averageResolutionTimeMs: 3302320485.4444447,
  ticketsPerDay: [],
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe('DashboardStats', () => {
  it('shows skeleton tiles while loading', () => {
    mockedAxios.get = vi.fn(() => new Promise(() => {}));

    renderWithQuery(<DashboardStats />);

    const skeletons = document.querySelectorAll("[data-slot='skeleton']");
    expect(skeletons.length).toBe(10);
  });

  it('shows an error message when the request fails', async () => {
    mockedAxios.get = vi.fn().mockRejectedValue(new Error('Network Error'));

    renderWithQuery(<DashboardStats />);

    await waitFor(() =>
      expect(
        screen.getByText('Failed to load dashboard stats.'),
      ).toBeInTheDocument(),
    );
  });

  it('renders formatted stat values', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: { stats: mockStats } });

    renderWithQuery(<DashboardStats />);

    await waitFor(() => screen.getByText('Total Tickets'));

    expect(screen.getByText('106')).toBeInTheDocument();
    expect(screen.getByText('61')).toBeInTheDocument();
    expect(screen.getByText('Resolved by AI')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('1.9%')).toBeInTheDocument();
    expect(screen.getByText('38.2d')).toBeInTheDocument();
  });

  it('formats a null average resolution time as an em dash', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({
      data: { stats: { ...mockStats, averageResolutionTimeMs: null } },
    });

    renderWithQuery(<DashboardStats />);

    await waitFor(() => screen.getByText('Avg. Resolution Time'));

    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('calls the stats endpoint with credentials', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: { stats: mockStats } });

    renderWithQuery(<DashboardStats />);

    await waitFor(() => screen.getByText('Total Tickets'));

    expect(mockedAxios.get).toHaveBeenCalledWith('/api/tickets/stats', {
      withCredentials: true,
    });
  });
});
