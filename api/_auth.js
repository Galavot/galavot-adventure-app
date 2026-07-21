// api/_auth.js
//
// Helper compartilhado de autenticação, usado tanto pelo /admin quanto pela
// nova área de parceiros /parceiro. Reaproveita a mesma ADMIN_SECRET já
// configurada na Vercel — não precisa cadastrar nenhuma variável nova.

import crypto from "crypto";

function sign(payload, secret) {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

// Compara duas strings em tempo constante — evita que um atacante consiga
// "adivinhar" a assinatura correta medindo o tempo de resposta.
function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function issueToken({ role, id = "" }, secret, hours = 12) {
  const expiry = Date.now() + hours * 60 * 60 * 1000;
  const payload = `${expiry}:${role}:${id}`;
  const signature = sign(payload, secret);
  return `${payload}.${signature}`;
}

export function verifyToken(req, secret, expectedRole) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "");
  if (!token || !secret) return null;

  const dotIndex = token.lastIndexOf(".");
  if (dotIndex === -1) return null;
  const payload = token.slice(0, dotIndex);
  const signature = token.slice(dotIndex + 1);

  const expected = sign(payload, secret);
  if (!safeEqual(signature, expected)) return null;

  const [expiryStr, role, id] = payload.split(":");
  const expiry = Number(expiryStr);
  if (Number.isNaN(expiry) || Date.now() > expiry) return null;
  if (expectedRole && role !== expectedRole) return null;

  return { role, id };
}
