// api/admin-guides.js
//
// GET   -> lista todos os guias, ou os turnos pagos (?resource=shifts)
// POST  -> cadastra um novo guia, ou registra um turno pago (action: "register_shift")
// PATCH -> ativa/desativa um guia ou muda os turnos que ele recebe
// DELETE -> exclui um guia (id), ou desfaz um turno pago (shiftId)
//
// Guias e turnos pagos moram na mesma função pra não estourar o limite
// de funções serverless da Vercel (12/12) — dá pra fazer isso porque as
// duas coisas são pequenas e sempre autenticadas do mesmo jeito.
//
// Protegida por token de admin.

import { createClient } from "@supabase/supabase-js";
import { verifyToken } from "./_auth.js";

export default async function handler(req, res) {
  const auth = verifyToken(req, process.env.ADMIN_SECRET, "admin");
  if (!auth) {
    return res.status(401).json({ error: "Sessão inválida ou expirada. Faça login novamente." });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ error: "Banco de dados não configurado." });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  if (req.method === "GET") {
    if (req.query.resource === "shifts") {
      const { data, error } = await supabase
        .from("guide_shifts")
        .select("*")
        .order("tour_date", { ascending: false });
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ shifts: data || [] });
    }

    const { data, error } = await supabase.from("guides").select("*").order("created_at", { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ guides: data || [] });
  }

  if (req.method === "POST") {
    if (req.body.action === "register_shift") {
      const { guideId, date, turno } = req.body;
      if (!guideId || !date || !turno) {
        return res.status(400).json({ error: "guideId, date e turno são obrigatórios" });
      }
      if (!["matinal", "vespertino"].includes(turno)) {
        return res.status(400).json({ error: "Turno inválido" });
      }

      const { data, error } = await supabase
        .from("guide_shifts")
        .insert({ guide_id: guideId, tour_date: date, turno, valor: 100 })
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          return res
            .status(409)
            .json({ error: "Já tem um guia registrado nesse turno nesse dia. Desfaça antes de trocar." });
        }
        return res.status(500).json({ error: error.message });
      }
      return res.status(200).json({ shift: data });
    }

    const { nome, whatsapp, recebeMatinal, recebeVespertino } = req.body;
    if (!nome || !whatsapp) {
      return res.status(400).json({ error: "Nome e WhatsApp são obrigatórios" });
    }

    const { data, error } = await supabase
      .from("guides")
      .insert({
        nome,
        whatsapp,
        recebe_matinal: recebeMatinal !== false,
        recebe_vespertino: recebeVespertino !== false,
        ativo: true,
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ guide: data });
  }

  if (req.method === "PATCH") {
    const { id, ...updates } = req.body;
    if (!id) return res.status(400).json({ error: "id é obrigatório" });

    const allowed = {};
    if (typeof updates.ativo === "boolean") allowed.ativo = updates.ativo;
    if (typeof updates.recebeMatinal === "boolean") allowed.recebe_matinal = updates.recebeMatinal;
    if (typeof updates.recebeVespertino === "boolean") allowed.recebe_vespertino = updates.recebeVespertino;

    const { data, error } = await supabase.from("guides").update(allowed).eq("id", id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ guide: data });
  }

  if (req.method === "DELETE") {
    if (req.body.shiftId) {
      const { error } = await supabase.from("guide_shifts").delete().eq("id", req.body.shiftId);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ ok: true });
    }

    const { id } = req.body;
    if (!id) return res.status(400).json({ error: "id é obrigatório" });
    const { error } = await supabase.from("guides").delete().eq("id", id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Método não permitido" });
}
