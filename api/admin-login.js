// api/admin-login.js
//
// Verifica a senha do painel administrativo e devolve um "token" de sessão
// válido por 12 horas. O token é assinado com ADMIN_SECRET, então não dá
// pra ser forjado sem conhecer essa chave.

import crypto from "crypto";

function sign(payload, secret) {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminSecret = process.env.ADMIN_SECRET;

  if (!adminPassword || !adminSecret) {
    return res.status(500).json({
      error: "Painel administrativo não configurado. Veja o README para configurar ADMIN_PASSWORD e ADMIN_SECRET.",
    });
  }

  const { password } = req.body;

  if (password !== adminPassword) {
    return res.status(401).json({ error: "Senha incorreta" });
  }

  const expiry = Date.now() + 12 * 60 * 60 * 1000; // 12 horas
  const payload = String(expiry);
  const signature = sign(payload, adminSecret);
  const token = `${payload}.${signature}`;

  return res.status(200).json({ token });
}
