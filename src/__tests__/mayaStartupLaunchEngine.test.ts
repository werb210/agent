import { vi, type Mock } from "vitest";
import { checkStartupProductLaunch } from "../core/mayaStartupLaunchEngine.js";
import { pool } from "../integrations/bfServerClient.js";
import { sendStartupNotification } from "../services/mayaStartupNotificationService.js";
import { launchStartupCampaign } from "../services/mayaStartupCampaignService.js";
import { logAudit } from "../infrastructure/mayaAudit.js";

vi.mock("../db", () => ({
  pool: {
    query: vi.fn(),
    request: vi.fn()
  }
}));

vi.mock("../services/mayaStartupNotificationService", () => ({
  sendStartupNotification: vi.fn()
}));

vi.mock("../services/mayaStartupCampaignService", () => ({
  launchStartupCampaign: vi.fn()
}));

vi.mock("../infrastructure/mayaAudit", () => ({
  logAudit: vi.fn()
}));

describe("checkStartupProductLaunch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does nothing when startup product is not active", async () => {
    (pool.query as Mock).mockResolvedValueOnce({ rows: [] });

    await checkStartupProductLaunch();

    expect(sendStartupNotification).not.toHaveBeenCalled();
    expect(launchStartupCampaign).not.toHaveBeenCalled();
    expect(logAudit).not.toHaveBeenCalled();
  });

  it("notifies waiting contacts, launches campaign, and records logs", async () => {
    (pool.query as Mock)
      .mockResolvedValueOnce({ rows: [{ id: "product-1" }] })
      .mockResolvedValueOnce({
        rows: [
          { id: "contact-1", name: "Pat", email: "pat@example.com", phone: "+155555501" },
          { id: "contact-2", name: "Sam", email: "sam@example.com", phone: null }
        ]
      })
      .mockResolvedValue({ rows: [] });

    await checkStartupProductLaunch();

    expect(sendStartupNotification).toHaveBeenCalledTimes(2);
    expect((pool.request as Mock).mock.calls.some((call) => String(call[0]).includes("UPDATE crm_contacts"))).toBe(true);
    expect(launchStartupCampaign).toHaveBeenCalledTimes(1);
    expect((pool.request as Mock).mock.calls.some((call) => String(call[0]).includes("INSERT INTO maya_startup_launch_log"))).toBe(true);
    expect(logAudit).toHaveBeenCalledWith("maya", "startup_product_launch", {
      product_id: "product-1",
      notified: 2
    });
  });
});