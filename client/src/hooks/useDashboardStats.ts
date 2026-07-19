import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import type { DashboardStats } from '@helpdesk/core';

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () =>
      axios
        .get<{ stats: DashboardStats }>('/api/tickets/stats', {
          withCredentials: true,
        })
        .then((res) => res.data.stats),
  });
}
