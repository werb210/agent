import { vi } from 'vitest';

const query = vi.fn().mockResolvedValue({
  rows: [],
  rowCount: 0,
});

const request = vi.fn(() => ({
  input: vi.fn().mockReturnThis(),
  query,
}));

export const pool = {
  request,
  query,
};

export default { pool };
