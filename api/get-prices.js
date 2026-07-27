// api/get-prices.js
//
// Endpoint público (sem login) que devolve o preço ATUAL de cada passeio.
// O app chama isso ao carregar, em vez de usar só o preço fixo do código —
// assim, quando o preço é alterado no /admin (ex: promoção), todo o site
// atualiza sozinho, sem precisar de um novo deploy.
//
// Se a tabela "tour_prices" ainda não tiver nenhuma linha pra um passeio,
// cai no preço padrão definido em src/data.js (TOURS).

import { createClient } from "@supabase/supabase-js";
import { TOURS } from "../src/data.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const defaults = {};
  TOURS.forEach((t) => {
    defaults[t.id] = t.price;
  });

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return res.status(200).json({ prices: defaults });
  }

  const supabase = createClient(supabaseUrl, serviceKey);
  const { data, error } = await supabase.from("tour_prices").select("tour_id, price");

  if (error) {
    // Se der algum problema no banco, não trava o site — usa os preços
    // padrão em vez de mostrar erro pro cliente.
    return res.status(200).json({ prices: defaults });
  }

  const prices = { ...defaults };
  (data || []).forEach((row) => {
    prices[row.tour_id] = Number(row.price);
  });

  return res.status(200).json({ prices });
}
