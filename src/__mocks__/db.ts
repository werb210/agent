const query = jest.fn().mockResolvedValue({
  rows: [],
  rowCount: 0,
});

const request = jest.fn(() => ({
  input: jest.fn().mockReturnThis(),
  query,
}));

export const pool = {
  request,
  query,
};

export default { pool };
