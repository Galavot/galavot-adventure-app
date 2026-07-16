// api/_verifyAdmin.js
//
// Função auxiliar usada pelas outras rotas /api/admin-* para conferir se
// o token enviado é válido e ainda não expirou.

import crypto from "crypto";

function sign(payload, secret) {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

export function verifyAdminToken(req) {
  const adminSecret = process.env.ADMIN_SECRET;
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "");

  if (!token || !adminSecret) return false;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;

  const expected = sign(payload, adminSecret);
  if (signature !== expected) return false;

  const expiry = Number(payload);
  if (Number.isNaN(expiry) || Date.now() > expiry) return false;

  return true;
}
