// api/admin-mark-commission-paid.js
//
// Marca todas as reservas pendentes de um parceiro como comissão paga.
// Protegida por token de admin.

import { createClient } from "@supabase/supabase-js";
import { verifyToken } from "./_auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const auth = verifyToken(req, process.env.ADMIN_SECRET, "admin");
  if (!auth) {
    return res.status(401).json({ error: "Sessão inválida ou expirada. Faça login novamente." });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ error: "Banco de dados não configurado." });
  }

  const { partnerId } = req.body;
  if (!partnerId) return res.status(400).json({ error: "partnerId é obrigatório" });

  const supabase = createClient(supabaseUrl, serviceKey);

  const { data, error } = await supabase
    .from("bookings")
    .update({ comissao_paga: true })
    .eq("partner_id", partnerId)
    .eq("comissao_paga", false)
    .neq("status", "cancelado")
    .select();

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ updated: data?.length || 0 });
}
