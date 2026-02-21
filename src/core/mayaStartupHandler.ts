import { getAvailableProductCategories } from "./mayaProductIntelligence";

export async function handleStartupInquiry(message: string) {
  const categories = await getAvailableProductCategories();

  const hasStartup = categories.some((c) => c.toLowerCase().includes("startup"));

  if (hasStartup) {
    return {
      status: "available",
      reply: "Yes — we currently offer startup funding options. I’ll walk you through the details."
    };
  }

  return {
    status: "not_available",
    reply: "At the moment we do not offer startup funding. Would you like to be notified as soon as it becomes available?"
  };
}
