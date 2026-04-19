import { callBFServer } from "../../integrations/bfServerClient.js";

export async function getAvailableStaff() {
  const pipelineResponse = await callBFServer<any>("/api/staff/pipeline");
  const staffList = Array.isArray(pipelineResponse)
    ? pipelineResponse
    : Array.isArray(pipelineResponse?.staff)
      ? pipelineResponse.staff
      : Array.isArray(pipelineResponse?.rows)
        ? pipelineResponse.rows
        : [];

  const available = staffList.find((staff: any) => {
    const status = String(staff?.status ?? "").toLowerCase();
    return (status === "online" || status === "available") && !staff?.on_call && !staff?.onCall;
  });

  if (!available) return null;

  return {
    id: available.id,
    phone: available.phone,
  };
}
