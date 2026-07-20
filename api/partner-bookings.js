// api/partner-bookings.js
//
// GET -> lista as reservas feitas pelo parceiro logado + resumo de comissão
// (pendente e já paga). Protegida por token de parceiro.

import { createClient } from "@supabase/supabase-js";
import { verifyToken } from "./_auth.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const auth = verifyToken(req, process.env.ADMIN_SECRET, "partner");
  if (!auth) {
    return res.status(401).json({ error: "Sessão inválida ou expirada. Faça login novamente." });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ error: "Banco de dados não configurado." });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("partner_id", auth.id)
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  const bookings = data || [];
  const pendente = bookings
    .filter((b) => !b.comissao_paga && b.status !== "cancelado")
    .reduce((sum, b) => sum + Number(b.comissao_valor || 0), 0);
  const pago = bookings
    .filter((b) => b.comissao_paga)
    .reduce((sum, b) => sum + Number(b.comissao_valor || 0), 0);

  return res.status(200).json({ bookings, comissaoPendente: pendente, comissaoPaga: pago });
}
