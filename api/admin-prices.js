// api/admin-prices.js
//
// GET (sem token)  -> modo público: devolve só { prices: { matinal: 350, ... } }
//                     usado pelo site pra saber o preço atual de cada passeio
// GET (com token admin) -> modo admin: devolve lista detalhada (nome, preço,
//                     vagas por turno, se é o padrão, quando foi atualizado)
//                     pra tela de edição
// PATCH (com token admin) -> atualiza o preço E/OU o número de vagas
//                     (quadriciclos) por turno de um passeio. Manda só o
//                     campo que quer mudar (price ou maxQuadriciclos) — o
//                     outro fica como já estava.
//
// Os dois modos ficam no mesmo arquivo de propósito: a Vercel, no plano
// gratuito, limita a 12 funções serverless por deploy — juntar esse
// endpoint público com o admin evita passar do limite (veja também
// check-availability-batch.js, que substituiu check-availability.js).

import { createClient } from "@supabase/supabase-js";
import { verifyToken } from "./_auth.js";
import { TOURS } from "../src/data.js";

export default async function handler(req, res) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const defaults = {};
  TOURS.forEach((t) => {
    defaults[t.id] = t.price;
  });

  if (req.method === "GET") {
    const auth = verifyToken(req, process.env.ADMIN_SECRET, "admin");

    if (!supabaseUrl || !serviceKey) {
      return res.status(200).json(auth ? { prices: [] } : { prices: defaults });
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const { data, error } = await supabase
      .from("tour_prices")
      .select("tour_id, price, max_quadriciclos, updated_at");

    if (error) {
      return res.status(200).json(auth ? { prices: [] } : { prices: defaults });
    }

    // Modo público (sem token válido): só o mapa simples de preços atuais.
    if (!auth) {
      const prices = { ...defaults };
      (data || []).forEach((row) => {
        prices[row.tour_id] = Number(row.price);
      });
      return res.status(200).json({ prices });
    }

    // Modo admin: lista detalhada pra tela de edição.
    const prices = TOURS.map((t) => {
      const row = (data || []).find((r) => r.tour_id === t.id);
      return {
        tourId: t.id,
        tourName: t.name,
        price: row ? Number(row.price) : t.price,
        maxQuadriciclos: row?.max_quadriciclos != null ? Number(row.max_quadriciclos) : t.maxQuadriciclos || 5,
        updatedAt: row?.updated_at || null,
        isDefault: !row,
        isDefaultSlots: !row || row.max_quadriciclos == null,
      };
    });
    return res.status(200).json({ prices });
  }

  if (req.method === "PATCH") {
    const auth = verifyToken(req, process.env.ADMIN_SECRET, "admin");
    if (!auth) {
      return res.status(401).json({ error: "Sessão inválida ou expirada. Faça login novamente." });
    }
    if (!supabaseUrl || !serviceKey) {
      return res.status(500).json({ error: "Banco de dados não configurado." });
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const { tourId, price, maxQuadriciclos } = req.body;

    const tour = TOURS.find((t) => t.id === tourId);
    if (!tourId || !tour) {
      return res.status(400).json({ error: "Passeio inválido" });
    }

    // Aceita mudar só o preço, só as vagas, ou os dois juntos — o que não
    // vier no body mantém o valor atual (upsert com onConflict preenche o
    // resto a partir do que já existe na tabela, então só incluímos aqui
    // os campos que de fato vieram na requisição).
    const hasPrice = price !== undefined && price !== null && price !== "";
    const hasSlots = maxQuadriciclos !== undefined && maxQuadriciclos !== null && maxQuadriciclos !== "";

    if (!hasPrice && !hasSlots) {
      return res.status(400).json({ error: "Nada pra atualizar" });
    }

    const update = { tour_id: tourId, updated_at: new Date().toISOString() };

    if (hasPrice) {
      const numericPrice = Number(price);
      if (!numericPrice || numericPrice <= 0) {
        return res.status(400).json({ error: "Preço inválido" });
      }
      update.price = numericPrice;
    }

    if (hasSlots) {
      const numericSlots = Number(maxQuadriciclos);
      if (!Number.isInteger(numericSlots) || numericSlots < 0 || numericSlots > 50) {
        return res.status(400).json({ error: "Número de vagas inválido" });
      }
      update.max_quadriciclos = numericSlots;
    }

    // Se só um dos dois campos veio, precisa manter o outro como já
    // estava na tabela (senão o upsert gravaria NULL nele).
    if (!hasPrice || !hasSlots) {
      const { data: existing } = await supabase
        .from("tour_prices")
        .select("price, max_quadriciclos")
        .eq("tour_id", tourId)
        .single();
      if (!hasPrice) update.price = existing?.price ?? tour.price;
      if (!hasSlots) update.max_quadriciclos = existing?.max_quadriciclos ?? (tour.maxQuadriciclos || 5);
    }

    const { data, error } = await supabase
      .from("tour_prices")
      .upsert(update, { onConflict: "tour_id" })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ tourPrice: data });
  }

  return res.status(405).json({ error: "Método não permitido" });
}
