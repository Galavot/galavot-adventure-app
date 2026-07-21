// api/admin-login.js
//
// Verifica a senha do painel administrativo e devolve um token de sessão
// válido por 12 horas, assinado com ADMIN_SECRET.
//
// SEGURANÇA: bloqueia temporariamente um IP depois de várias tentativas
// erradas seguidas (ver api/_rateLimit.js), pra dificultar força bruta na
// senha do admin.

import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { issueToken } from "./_auth.js";
import { getClientIp, checkRateLimit, registerFailedAttempt } from "./_rateLimit.js";

function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminSecret = process.env.ADMIN_SECRET;
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!adminPassword || !adminSecret) {
    return res.status(500).json({
      error: "Painel administrativo não configurado. Veja o README para configurar ADMIN_PASSWORD e ADMIN_SECRET.",
    });
  }

  const ip = getClientIp(req);
  const supabase = supabaseUrl && serviceKey ? createClient(supabaseUrl, serviceKey) : null;

  if (supabase) {
    const { blocked, retryAfterMinutes } = await checkRateLimit(supabase, ip, "admin");
    if (blocked) {
      return res.status(429).json({
        error: `Muitas tentativas erradas. Tente novamente em ${retryAfterMinutes} minutos.`,
      });
    }
  }

  const { password } = req.body;

  if (!password || !safeEqual(password, adminPassword)) {
    if (supabase) await registerFailedAttempt(supabase, ip, "admin");
    return res.status(401).json({ error: "Senha incorreta" });
  }

  const token = issueToken({ role: "admin" }, adminSecret);
  return res.status(200).json({ token });
}
