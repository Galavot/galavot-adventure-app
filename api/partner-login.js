// api/partner-login.js
//
// Verifica o código de acesso + senha do parceiro contra a tabela
// "partners" no Supabase, e devolve um token de sessão (válido 12h).

import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { issueToken } from "./_auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const adminSecret = process.env.ADMIN_SECRET;

  if (!supabaseUrl || !serviceKey || !adminSecret) {
    return res.status(500).json({ error: "Área de parceiros não configurada ainda." });
  }

  const { codigo, senha } = req.body;
  if (!codigo || !senha) {
    return res.status(400).json({ error: "Código e senha são obrigatórios" });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  const { data: partner, error } = await supabase
    .from("partners")
    .select("*")
    .eq("codigo", codigo.trim())
    .eq("ativo", true)
    .single();

  if (error || !partner) {
    return res.status(401).json({ error: "Código ou senha incorretos" });
  }

  const senhaValida = await bcrypt.compare(senha, partner.senha_hash);
  if (!senhaValida) {
    return res.status(401).json({ error: "Código ou senha incorretos" });
  }

  const token = issueToken({ role: "partner", id: partner.id }, adminSecret);
  return res.status(200).json({
    token,
    partner: { id: partner.id, nome: partner.nome, empresa: partner.empresa, comissao_percentual: partner.comissao_percentual },
  });
}
