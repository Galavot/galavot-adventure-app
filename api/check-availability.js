// api/check-availability.js
//
// Consulta pública (sem senha) que conta quantas reservas já existem pra
// um passeio + data específicos, e devolve quantos quadriciclos ainda
// estão disponíveis naquele turno. Usada na tela de escolha de data pra
// não deixar reservar além do limite (5 quadriciclos por turno).

import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const { tourId, date, max } = req.query;
  const maxQuadriciclos = Number(max) || 5;

  if (!tourId || !date) {
    return res.status(400).json({ error: "tourId e date são obrigatórios" });
  }

  // Se o banco ainda não estiver configurado, assume disponibilidade total
  // ao invés de travar o cliente (o painel /admin é que depende do banco;
  // a reserva em si não deve ficar bloqueada por isso).
  if (!supabaseUrl || !serviceKey) {
    return res.status(200).json({ booked: 0, max: maxQuadriciclos, available: maxQuadriciclos });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  const { count, error } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("tour_id", tourId)
    .eq("booking_date", date)
    .neq("status", "cancelado");

  if (error) {
    return res.status(200).json({ booked: 0, max: maxQuadriciclos, available: maxQuadriciclos });
  }

  const booked = count || 0;
  const available = Math.max(0, maxQuadriciclos - booked);

  return res.status(200).json({ booked, max: maxQuadriciclos, available });
}
