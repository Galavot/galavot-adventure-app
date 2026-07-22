// api/check-availability-batch.js
//
// Igual ao check-availability.js, mas devolve a disponibilidade de VÁRIAS
// datas de uma vez (usado pelos indicadores verde/vermelho nos botões de
// data da tela "Escolha o Dia"). Evita fazer 30 consultas separadas toda
// vez que a tela abre.

import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const { tourId, max, dates } = req.query;
  const maxQuadriciclos = Number(max) || 5;

  if (!tourId || !dates) {
    return res.status(400).json({ error: "tourId e dates são obrigatórios" });
  }

  const dateList = String(dates)
    .split(",")
    .map((d) => d.trim())
    .filter(Boolean);

  // Se o banco ainda não estiver configurado, assume disponibilidade total
  // em todas as datas ao invés de travar o cliente.
  if (!supabaseUrl || !serviceKey) {
    const fallback = {};
    dateList.forEach((d) => {
      fallback[d] = maxQuadriciclos;
    });
    return res.status(200).json({ availability: fallback, max: maxQuadriciclos });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  const { data, error } = await supabase
    .from("bookings")
    .select("booking_date")
    .eq("tour_id", tourId)
    .in("booking_date", dateList)
    .neq("status", "cancelado");

  const bookedCounts = {};
  if (!error && data) {
    for (const row of data) {
      bookedCounts[row.booking_date] = (bookedCounts[row.booking_date] || 0) + 1;
    }
  }

  const availability = {};
  for (const d of dateList) {
    const booked = bookedCounts[d] || 0;
    availability[d] = Math.max(0, maxQuadriciclos - booked);
  }

  return res.status(200).json({ availability, max: maxQuadriciclos });
}
