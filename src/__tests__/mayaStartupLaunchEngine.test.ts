import { checkStartupProductLaunch } from "../core/mayaStartupLaunchEngine";
import { pool } from "../db";
import { sendStartupNotification } from "../services/mayaStartupNotificationService";
import { launchStartupCampaign } from "../services/mayaStartupCampaignService";
import { logAudit } from "../infrastructure/mayaAudit";

jest.mock("../db", () => ({
  pool: {
    query: jest.fn()
  }
}));

jest.mock("../services/mayaStartupNotificationService", () => ({
  sendStartupNotification: jest.fn()
}));

jest.mock("../services/mayaStartupCampaignService", () => ({
  launchStartupCampaign: jest.fn()
}));

jest.mock("../infrastructure/mayaAudit", () => ({
  logAudit: jest.fn()
}));

describe("checkStartupProductLaunch", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("does nothing when startup product is not active", async () => {
    (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

    await checkStartupProductLaunch();

    expect(sendStartupNotification).not.toHaveBeenCalled();
    expect(launchStartupCampaign).not.toHaveBeenCalled();
    expect(logAudit).not.toHaveBeenCalled();
  });

  it("notifies waiting contacts, launches campaign, and records logs", async () => {
    (pool.query as jest.Mock)
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
    expect((pool.query as jest.Mock).mock.calls.some((call) => String(call[0]).includes("UPDATE crm_contacts"))).toBe(true);
    expect(launchStartupCampaign).toHaveBeenCalledTimes(1);
    expect((pool.query as jest.Mock).mock.calls.some((call) => String(call[0]).includes("INSERT INTO maya_startup_launch_log"))).toBe(true);
    expect(logAudit).toHaveBeenCalledWith("maya", "startup_product_launch", {
      product_id: "product-1",
      notified: 2
    });
  });
});
