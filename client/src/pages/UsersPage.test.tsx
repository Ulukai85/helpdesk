import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import axios from 'axios';
import UsersPage from './UsersPage';
import { renderWithQuery } from '@/test/render-with-query';

vi.mock('axios');
const mockedAxios = vi.mocked(axios);

beforeEach(() => {
  vi.resetAllMocks();
  // Keep UsersTable in a permanent loading state — not under test here
  mockedAxios.get = vi.fn(() => new Promise(() => {}));
});

describe('UsersPage', () => {
  it('does not show the dialog on initial render', () => {
    renderWithQuery(<UsersPage />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows the dialog when Create User is clicked', async () => {
    const user = userEvent.setup();
    renderWithQuery(<UsersPage />);

    await user.click(screen.getByRole('button', { name: /create user/i }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('hides the dialog when Escape is pressed', async () => {
    const user = userEvent.setup();
    renderWithQuery(<UsersPage />);

    await user.click(screen.getByRole('button', { name: /create user/i }));
    await user.keyboard('{Escape}');

    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
  });

  it('hides the dialog when clicking outside', async () => {
    const user = userEvent.setup();
    renderWithQuery(<UsersPage />);

    await user.click(screen.getByRole('button', { name: /create user/i }));
    await screen.findByRole('dialog');

    await user.click(document.querySelector("[data-slot='dialog-overlay']")!);

    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
  });
});
