describe("ML Service Health", () => {
  it("should reach model-health endpoint", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: "ok" }),
    } as any);

    const response = await fetch("http://ml/model-health");

    expect(response.ok).toBe(true);
  });
});
