export const request = jest.fn(() => ({
  input: jest.fn().mockReturnThis(),
  query: jest.fn().mockResolvedValue({ recordset: [] }),
}));

export const pool = {
  request,
};

export default {
  pool,
};
