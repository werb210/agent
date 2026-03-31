const ML_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:8001";

describe("ML Service Health", () => {
  it("should reach model-health endpoint", async () => {
    const fetchSpy = jest.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ model_loaded: true }),
    } as Response);

    const response = await fetch(`${ML_URL}/model-health`, {
      headers: { "X-Internal-Secret": process.env.ML_INTERNAL_SECRET ?? "" }
    });

    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data).toEqual(expect.objectContaining({ model_loaded: true }));

    fetchSpy.mockRestore();
  });
});
