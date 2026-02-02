// @vitest-environment node
import { describe, it, expect } from 'vitest';
import api from '../api/api';

describe('Integración frontend-backend', () => {
  it('el backend responde correctamente al endpoint /health', async () => {
    const response = await api.get('/health');

    expect(response.status).toBe(200);
    expect(response.data).toEqual({ status: 'ok' });
  });
});
