import axios from "axios";

jest.mock("axios");

const mockedAxios = axios as jest.Mocked<typeof axios>;
const ML_URL = process.env.ML_SERVICE_URL || "http://localhost:8001";

describe("ML Service Health", () => {
  it("should reach model-health endpoint", async () => {
    mockedAxios.get.mockResolvedValueOnce({
      status: 200,
      data: { model_loaded: true }
    } as any);

    const response = await axios.get(`${ML_URL}/model-health`, {
      headers: { "X-Internal-Secret": process.env.ML_INTERNAL_SECRET }
    });

    expect(response.status).toBe(200);
    expect(response.data).toEqual(expect.objectContaining({ model_loaded: true }));
  });
});
