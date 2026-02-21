export function enforcePolicy(userType: "client" | "staff" | "admin") {
  return {
    canViewRevenue: userType !== "client",
    canViewApplications: true,
    canViewOtherClients: userType === "admin",
    canModifyCampaigns: userType === "admin"
  };
}
