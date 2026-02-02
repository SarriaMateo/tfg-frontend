import { describe, it, expect, vi } from 'vitest';
import api from '../api/api';
import { getHealth } from './healthService';

vi.mock('../api/api');

describe('healthService', () => {
  it('llama al endpoint /health', async () => {
    api.get.mockResolvedValue({ data: { status: 'ok' } });

    const response = await getHealth();

    expect(api.get).toHaveBeenCalledWith('/health');
    expect(response.data.status).toBe('ok');
  });
});
