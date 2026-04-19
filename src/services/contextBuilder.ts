import { AppError } from "../errors/AppError.js";
import { db } from "./db.js";

type MayaContextParams = {
  applicationId: string;
  userId: string;
  role: string;
};

export async function buildMayaContext({ applicationId, userId, role }: MayaContextParams) {
  const application = await db.getApplicationById(applicationId, userId);

  if (!application) {
    throw new AppError("not_found", 404, "Application not found for user scope");
  }

  return {
    applicationId,
    userId,
    role,
    application
  };
}

