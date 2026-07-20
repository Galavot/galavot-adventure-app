// api/admin-partners.js
//
// GET  -> lista todos os parceiros
// POST -> cria um novo parceiro (nome, empresa, código, senha)
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
    const { nome, empresa, codigo, senha, comissaoPercentual } = req.body;
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
        ativo: true,
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    const { senha_hash: _omit, ...partner } = data;
    return res.status(200).json({ partner });
  }

  if (req.method === "PATCH") {
    const { id, ativo } = req.body;
    if (!id || typeof ativo !== "boolean") {
      return res.status(400).json({ error: "id e ativo são obrigatórios" });
    }
    const { data, error } = await supabase.from("partners").update({ ativo }).eq("id", id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    const { senha_hash: _omit, ...partner } = data;
    return res.status(200).json({ partner });
  }

  return res.status(405).json({ error: "Método não permitido" });
}
