import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import HealthStatus from './HealthStatus';
import * as healthService from '../services/healthService';

vi.mock('../services/healthService');

test('muestra el estado del backend', async () => {
  healthService.getHealth.mockResolvedValue({
    data: { status: 'ok' },
  });

  render(<HealthStatus />);

  await waitFor(() =>
    expect(screen.getByText(/Backend status: ok/i)).toBeInTheDocument()
  );
});
