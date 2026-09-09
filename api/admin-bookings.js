// api/admin-bookings.js
//
// GET  -> lista todas as reservas (mais recentes primeiro)
// PATCH -> atualiza o status de uma reserva (ex: "confirmado" -> "cancelado")
//
// Protegida por token: exige o header "Authorization: Bearer <token>"
// obtido em /api/admin-login.

import { createClient } from "@supabase/supabase-js";
import { verifyToken } from "./_auth.js";
import { expireAllStalePendingBookings } from "./_bookingExpiry.js";
import { getMaxQuadriciclos } from "./_slots.js";
import { isDateBlocked } from "./_blockedDates.js";
import { getBrazilNow } from "./_brazilTime.js";
import { TOURS } from "../src/data.js";

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
    // Expira reservas pendentes vencidas ANTES de listar, senão o painel
    // mostraria "pendente_pagamento" indefinidamente pra uma reserva que
    // já passou dos 20min, só porque ninguém tentou reservar de novo
    // aquele mesmo passeio+data pra disparar a limpeza automaticamente.
    await expireAllStalePendingBookings(supabase);

    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ bookings: data });
  }

  if (req.method === "PATCH") {
    const { id, status, newDate, newTourId } = req.body;
    if (!id) return res.status(400).json({ error: "id é obrigatório" });

    // Remarcar a reserva pra outra data (e opcionalmente pra outro turno,
    // manhã/tarde) — usado quando o cliente não pode ir no dia combinado
    // e quer trocar, mantendo o mesmo pagamento já feito.
    if (newDate) {
      // Trava simples: não deixa remarcar pra uma data que já passou (fuso
      // do Brasil, mesma fonte de verdade usada em todo o resto do app).
      // Data de hoje ainda é permitida, só não deixa mandar pro passado.
      const { dateStr: hojeBrasil } = getBrazilNow();
      if (newDate < hojeBrasil) {
        return res.status(400).json({ error: "Não é possível remarcar pra uma data que já passou." });
      }

      const { data: current, error: fetchError } = await supabase
        .from("bookings")
        .select("tour_id, tour_name, booking_date")
        .eq("id", id)
        .single();
      if (fetchError || !current) return res.status(404).json({ error: "Reserva não encontrada." });

      const targetTourId = newTourId || current.tour_id;
      const tour = TOURS.find((t) => t.id === targetTourId);
      if (!tour) return res.status(400).json({ error: "Passeio inválido." });

      if (await isDateBlocked(supabase, targetTourId, newDate)) {
        return res.status(409).json({ error: "Essa data está bloqueada pra esse passeio. Escolha outra." });
      }

      const maxQuadriciclos = await getMaxQuadriciclos(supabase, tour);
      const { data: sameDateBookings, error: countError } = await supabase
        .from("bookings")
        .select("id")
        .eq("tour_id", targetTourId)
        .eq("booking_date", newDate)
        .not("status", "in", "(cancelado,pagamento_recusado)")
        .neq("id", id); // não conta a própria reserva que está sendo movida

      if (countError) return res.status(500).json({ error: countError.message });
      if ((sameDateBookings?.length || 0) >= maxQuadriciclos) {
        return res.status(409).json({ error: "Essa data já está sem vaga pra esse passeio. Escolha outra." });
      }

      const { data, error } = await supabase
        .from("bookings")
        .update({
          booking_date: newDate,
          tour_id: targetTourId,
          tour_name: tour.name,
          booking_time: tour.time,
          // A reserva remarcada sai como confirmada — o pagamento já
          // estava feito, só a data mudou. Isso também resolve, de
          // quebra, um "conflito_vaga" pendente pra essa reserva.
          status: "confirmado",
        })
        .eq("id", id)
        .select()
        .single();

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ booking: data });
    }

    if (!status) return res.status(400).json({ error: "status é obrigatório" });

    const { data, error } = await supabase
      .from("bookings")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ booking: data });
  }

  return res.status(405).json({ error: "Método não permitido" });
}
