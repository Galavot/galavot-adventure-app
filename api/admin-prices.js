// api/admin-prices.js
//
// GET (sem token)  -> modo público: devolve só { prices: { matinal: 350, ... } }
//                     usado pelo site pra saber o preço atual de cada passeio
// GET (com token admin) -> modo admin: devolve lista detalhada (nome, preço,
//                     se é o padrão, quando foi atualizado) pra tela de edição
// PATCH (com token admin) -> atualiza o preço de um passeio (ex: promoção)
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
    const { data, error } = await supabase.from("tour_prices").select("tour_id, price, updated_at");

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
        updatedAt: row?.updated_at || null,
        isDefault: !row,
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
    const { tourId, price } = req.body;
    const numericPrice = Number(price);

    if (!tourId || !TOURS.find((t) => t.id === tourId)) {
      return res.status(400).json({ error: "Passeio inválido" });
    }
    if (!numericPrice || numericPrice <= 0) {
      return res.status(400).json({ error: "Preço inválido" });
    }

    const { data, error } = await supabase
      .from("tour_prices")
      .upsert({ tour_id: tourId, price: numericPrice, updated_at: new Date().toISOString() }, { onConflict: "tour_id" })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ tourPrice: data });
  }

  return res.status(405).json({ error: "Método não permitido" });
}
