// api/admin-mark-commission-paid.js
//
// Marca a comissão de reservas específicas de um parceiro como paga —
// permite acerto total ou parcial (o admin escolhe quais reservas está
// pagando agora, ex: só os passeios que já aconteceram). Protegida por
// token de admin.

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

  const { partnerId, bookingIds } = req.body;
  if (!partnerId) return res.status(400).json({ error: "partnerId é obrigatório" });

  const supabase = createClient(supabaseUrl, serviceKey);

  let query = supabase
    .from("bookings")
    .update({ comissao_paga: true })
    .eq("partner_id", partnerId)
    .eq("comissao_paga", false)
    // Só marca como paga comissão de reserva que realmente foi paga pelo
    // cliente — nunca de reserva pendente, recusada ou cancelada.
    .in("status", ["confirmado", "concluido"]);

  // Se vier uma lista específica de reservas (acerto parcial escolhido
  // na janela do ADM), restringe só a elas. Sem lista, mantém o
  // comportamento antigo de marcar tudo que está pendente pra esse
  // parceiro — usado como atalho de "acerto total".
  if (Array.isArray(bookingIds) && bookingIds.length > 0) {
    query = query.in("id", bookingIds);
  }

  const { data, error } = await query.select();

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ updated: data?.length || 0, bookings: data || [] });
}
