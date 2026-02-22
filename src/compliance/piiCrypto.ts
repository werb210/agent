import { decrypt, encrypt } from "./encryption";
import { maskEmail, maskPhone } from "./masking";
import { logPIIAccess } from "./piiAccessLogger";

export function encryptPIIFields(payload: { [key: string]: any; email?: string; phone?: string }) {
  const next = { ...payload };

  if (typeof next.email === "string" && next.email.length > 0) {
    next.email = encrypt(next.email);
  }

  if (typeof next.phone === "string" && next.phone.length > 0) {
    next.phone = encrypt(next.phone);
  }

  return next;
}

export async function decryptAndMaskContact<T extends { email: string | null; phone: string | null }>(
  contact: T,
  userId: string,
  entityId: string,
  isAdmin = false
) {
  let email: string | null = null;
  let phone: string | null = null;

  if (contact.email) {
    email = decrypt(contact.email);
    await logPIIAccess(userId, "email", entityId);
    if (!isAdmin) {
      email = maskEmail(email);
    }
  }

  if (contact.phone) {
    phone = decrypt(contact.phone);
    await logPIIAccess(userId, "phone", entityId);
    if (!isAdmin) {
      phone = maskPhone(phone);
    }
  }

  return { ...contact, email, phone };
}
