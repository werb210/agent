import { bfServerRequest } from "../integrations/bfServerClient";

type ModelProxy = {
  create: (args: unknown) => Promise<unknown>;
  findMany: (args?: unknown) => Promise<unknown[]>;
  findUnique: (args: unknown) => Promise<unknown>;
  findFirst: (args: unknown) => Promise<unknown>;
  update: (args: unknown) => Promise<unknown>;
  upsert: (args: unknown) => Promise<unknown>;
};

const modelProxy = (model: string): ModelProxy => ({
  create: (args) => bfServerRequest("/api/applications/create", "POST", { model, action: "create", args }),
  findMany: async (args) => {
    const result = await bfServerRequest("/api/crm/contacts", "GET", { model, action: "findMany", args });
    return Array.isArray(result) ? result : [];
  },
  findUnique: (args) => bfServerRequest("/api/applications/status", "GET", { model, action: "findUnique", args }),
  findFirst: (args) => bfServerRequest("/api/staff/pipeline", "GET", { model, action: "findFirst", args }),
  update: (args) => bfServerRequest("/api/applications/create", "POST", { model, action: "update", args }),
  upsert: (args) => bfServerRequest("/api/applications/create", "POST", { model, action: "upsert", args })
});

export const prisma: Record<string, any> = new Proxy({}, {
  get: (_target, prop) => modelProxy(String(prop))
});
