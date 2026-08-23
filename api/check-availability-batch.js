// api/check-availability-batch.js
//
// Igual ao check-availability.js, mas devolve a disponibilidade de VÁRIAS
// datas de uma vez (usado pelos indicadores verde/vermelho nos botões de
// data da tela "Escolha o Dia"). Evita fazer 30 consultas separadas toda
// vez que a tela abre.

import { createClient } from "@supabase/supabase-js";
import { TOURS } from "../src/data.js";
import { isPastSameDayCutoff } from "./_brazilTime.js";
import { expireStalePendingBookingsBatch } from "./_bookingExpiry.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const { tourId, max, dates } = req.query;
  const maxQuadriciclos = Number(max) || 5;
  const tour = TOURS.find((t) => t.id === tourId);

  if (!tourId || !dates) {
    return res.status(400).json({ error: "tourId e dates são obrigatórios" });
  }

  const dateList = String(dates)
    .split(",")
    .map((d) => d.trim())
    .filter(Boolean);

  // Data (se houver) que está com vaga real no banco mas já passou da
  // hora limite de reserva de última hora pra esse passeio — usado pelo
  // app pra mostrar uma mensagem diferente de "esgotado".
  const cutoffBlockedDate = dateList.find((d) => isPastSameDayCutoff(tour, d)) || null;

  // Se o banco ainda não estiver configurado, assume disponibilidade total
  // em todas as datas ao invés de travar o cliente.
  if (!supabaseUrl || !serviceKey) {
    const fallback = {};
    dateList.forEach((d) => {
      fallback[d] = d === cutoffBlockedDate ? 0 : maxQuadriciclos;
    });
    return res.status(200).json({ availability: fallback, max: maxQuadriciclos, cutoffBlockedDate });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  // Libera de volta pra venda qualquer reserva pendente há mais de 20min
  // nessas datas, antes de contar quantas vagas já estão ocupadas.
  await expireStalePendingBookingsBatch(supabase, tourId, dateList);

  const { data, error } = await supabase
    .from("bookings")
    .select("booking_date")
    .eq("tour_id", tourId)
    .in("booking_date", dateList)
    .not("status", "in", "(cancelado,pagamento_recusado)");

  const bookedCounts = {};
  if (!error && data) {
    for (const row of data) {
      bookedCounts[row.booking_date] = (bookedCounts[row.booking_date] || 0) + 1;
    }
  }

  const availability = {};
  for (const d of dateList) {
    if (d === cutoffBlockedDate) {
      availability[d] = 0;
      continue;
    }
    const booked = bookedCounts[d] || 0;
    availability[d] = Math.max(0, maxQuadriciclos - booked);
  }

  return res.status(200).json({ availability, max: maxQuadriciclos, cutoffBlockedDate });
}
