// api/admin-bookings.js
//
// GET  -> lista todas as reservas (mais recentes primeiro)
// PATCH -> atualiza o status de uma reserva (ex: "confirmado" -> "cancelado")
//
// Protegida por token: exige o header "Authorization: Bearer <token>"
// obtido em /api/admin-login.

import { createClient } from "@supabase/supabase-js";
import { verifyAdminToken } from "./_verifyAdmin.js";

export default async function handler(req, res) {
  if (!verifyAdminToken(req)) {
    return res.status(401).json({ error: "Sessão inválida ou expirada. Faça login novamente." });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ error: "Banco de dados não configurado." });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ bookings: data });
  }

  if (req.method === "PATCH") {
    const { id, status } = req.body;
    if (!id || !status) return res.status(400).json({ error: "id e status são obrigatórios" });

    const { data, error } = await supabase
      .from("bookings")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ booking: data });
  }

  return res.status(405).json({ error: "Método não permitido" });
}
