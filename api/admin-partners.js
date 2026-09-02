// api/admin-partners.js
//
// GET    -> lista todos os parceiros
// POST   -> cria um novo parceiro (nome, empresa, código, senha)
// PATCH  -> ativa/desativa um parceiro
// DELETE -> exclui um parceiro (só é permitido se não houver reserva
//           vinculada a ele — senão, avisa e sugere desativar em vez de
//           excluir, pra não perder o histórico dessas reservas)
//
// Protegida por token de admin.

import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
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
    const { data, error } = await supabase.from("partners").select("*").order("created_at", { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    // Nunca devolve o hash da senha pro front-end
    const partners = (data || []).map(({ senha_hash, ...rest }) => rest);
    return res.status(200).json({ partners });
  }

  if (req.method === "POST") {
    const { nome, empresa, codigo, senha, comissaoPercentual, whatsapp } = req.body;
    if (!nome || !codigo || !senha) {
      return res.status(400).json({ error: "Nome, código e senha são obrigatórios" });
    }

    const senha_hash = await bcrypt.hash(senha, 10);

    const { data, error } = await supabase
      .from("partners")
      .insert({
        nome,
        empresa: empresa || null,
        codigo: codigo.trim(),
        senha_hash,
        comissao_percentual: comissaoPercentual || 10,
        whatsapp: whatsapp ? whatsapp.replace(/\D/g, "") : null,
        ativo: true,
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    const { senha_hash: _omit, ...partner } = data;
    return res.status(200).json({ partner });
  }

  if (req.method === "PATCH") {
    const { id, ativo, whatsapp } = req.body;
    if (!id) return res.status(400).json({ error: "id é obrigatório" });

    const updates = {};
    if (typeof ativo === "boolean") updates.ativo = ativo;
    if (whatsapp !== undefined) updates.whatsapp = whatsapp ? whatsapp.replace(/\D/g, "") : null;
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "Nada para atualizar" });
    }

    const { data, error } = await supabase.from("partners").update(updates).eq("id", id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    const { senha_hash: _omit, ...partner } = data;
    return res.status(200).json({ partner });
  }

  if (req.method === "DELETE") {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: "id é obrigatório" });

    // Confere se existe alguma reserva vinculada a esse parceiro antes de
    // excluir — evita perder o histórico de comissão de reservas reais.
    const { count } = await supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("partner_id", id);

    if ((count || 0) > 0) {
      return res.status(409).json({
        error: `Esse parceiro tem ${count} reserva(s) vinculada(s) e não pode ser excluído — desative-o em vez disso, pra manter o histórico.`,
      });
    }

    const { error } = await supabase.from("partners").delete().eq("id", id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Método não permitido" });
}
