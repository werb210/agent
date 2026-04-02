import { callBFServer } from "../integrations/bfServerClient";

type ModelProxy = {
  create: (args: unknown) => Promise<unknown>;
  findMany: (args?: unknown) => Promise<unknown[]>;
  findUnique: (args: unknown) => Promise<unknown>;
  findFirst: (args: unknown) => Promise<unknown>;
  update: (args: unknown) => Promise<unknown>;
  upsert: (args: unknown) => Promise<unknown>;
};

const modelProxy = (model: string): ModelProxy => ({
  create: (args) => callBFServer("/api/applications/create", { model, action: "create", args }),
  findMany: async (args) => {
    const result = await callBFServer("/api/crm/contacts", { model, action: "findMany", args });
    return Array.isArray(result) ? result : [];
  },
  findUnique: (args) => callBFServer("/api/applications/status", { model, action: "findUnique", args }),
  findFirst: (args) => callBFServer("/api/staff/pipeline", { model, action: "findFirst", args }),
  update: (args) => callBFServer("/api/applications/create", { model, action: "update", args }),
  upsert: (args) => callBFServer("/api/applications/create", { model, action: "upsert", args })
});

export const prisma: Record<string, any> = new Proxy({}, {
  get: (_target, prop) => modelProxy(String(prop))
});
