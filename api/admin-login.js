// api/admin-login.js
//
// Verifica a senha do painel administrativo e devolve um token de sessão
// válido por 12 horas, assinado com ADMIN_SECRET.

import { issueToken } from "./_auth.js";

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

  const token = issueToken({ role: "admin" }, adminSecret);
  return res.status(200).json({ token });
}
