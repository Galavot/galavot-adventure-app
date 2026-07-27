// api/admin-guides.js
//
// GET   -> lista todos os guias
// POST  -> cadastra um novo guia (nome, whatsapp, quais turnos recebe a lista)
// PATCH -> ativa/desativa um guia ou muda os turnos que ele recebe
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
    const { data, error } = await supabase.from("guides").select("*").order("created_at", { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ guides: data || [] });
  }

  if (req.method === "POST") {
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
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: "id é obrigatório" });
    const { error } = await supabase.from("guides").delete().eq("id", id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Método não permitido" });
}
