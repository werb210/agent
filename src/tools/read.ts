import jwt from "jsonwebtoken";

function token() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET not configured");
  return jwt.sign({ id: "agent-service", phone: "agent", role: "Staff" }, secret, { expiresIn: "1h" });
}

async function get<T>(path: string): Promise<T> {
  const base = process.env.SERVER_URL || "https://server.boreal.financial";
  const res = await fetch(`${base}${path}`, {
    headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`BF-Server GET ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

export async function readApplication(id: string): Promise<unknown> {
  return get(`/api/applications/${id}`);
}

export async function listApplications(silo: string = "BF"): Promise<unknown> {
  return get(`/api/applications?silo=${encodeURIComponent(silo)}`);
}

export async function readContact(id: string): Promise<unknown> {
  return get(`/api/crm/contacts/${id}`);
}

export async function listContacts(silo: string = "BF"): Promise<unknown> {
  return get(`/api/crm/contacts?silo=${encodeURIComponent(silo)}`);
}

export async function listLenderProducts(): Promise<unknown> {
  return get(`/api/client/lender-products`);
}

export async function listDocumentsForApplication(applicationId: string): Promise<unknown> {
  const app = await readApplication(applicationId) as any;
  return app?.data?.documents ?? [];
}
