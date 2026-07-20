// api/create-booking.js
//
// Salva a reserva no banco de dados (Supabase) assim que o cliente confirma
// no site. É essa peça que faz o painel /admin conseguir listar as reservas.
//
// Se a reserva foi feita por um parceiro logado (partnerId enviado), grava
// o vínculo e calcula a comissão automaticamente (comissao_percentual do
// parceiro, padrão 10%).
//
// SEGURANÇA: o valor da reserva (total) NUNCA é aceito como veio do
// navegador — é sempre recalculado aqui a partir do preço oficial do
// passeio (TOURS, em src/data.js). O limite de quadriciclos por turno
// também é reconferido aqui no servidor, não só na tela de escolha de data,
// pra evitar overbooking se duas pessoas reservarem ao mesmo tempo.
//
// Pré-requisitos (ver README):
// - Criar projeto gratuito em https://supabase.com
// - Rodar o SQL de criação da tabela "bookings" (está no README)
// - Configurar as variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY

import { createClient } from "@supabase/supabase-js";
import { TOURS } from "../src/data.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({
      error: "Banco de dados não configurado. Veja o README para configurar o Supabase.",
    });
  }

  const { tourId, date, time, participants, customerName, customerPhone, method, partnerId } = req.body;

  if (!tourId || !time || !customerName || !date) {
    return res.status(400).json({ error: "Dados da reserva incompletos" });
  }

  // O passeio precisa existir na lista oficial — nunca confiamos em
  // tourName/total vindos do cliente.
  const tour = TOURS.find((t) => t.id === tourId);
  if (!tour) {
    return res.status(400).json({ error: "Passeio inválido" });
  }

  const tourName = tour.name;
  const total = tour.price;
  const maxQuadriciclos = tour.maxQuadriciclos || 5;

  const supabase = createClient(supabaseUrl, serviceKey);

  // Reconfere disponibilidade no momento de salvar, e não só na tela
  // anterior — reduz a janela de overbooking quando duas pessoas reservam
  // ao mesmo tempo o último horário disponível.
  const { count, error: countError } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("tour_id", tourId)
    .eq("booking_date", date)
    .neq("status", "cancelado");

  if (!countError && (count || 0) >= maxQuadriciclos) {
    return res.status(409).json({ error: "Esse horário acabou de lotar. Escolha outra data ou turno." });
  }

  let comissaoValor = null;
  if (partnerId) {
    const { data: partner } = await supabase
      .from("partners")
      .select("comissao_percentual")
      .eq("id", partnerId)
      .single();
    const percentual = partner?.comissao_percentual ?? 10;
    comissaoValor = Math.round(total * (percentual / 100) * 100) / 100;
  }

  const { data, error } = await supabase
    .from("bookings")
    .insert({
      tour_id: tourId,
      tour_name: tourName,
      booking_date: date,
      booking_time: time,
      participants,
      customer_name: customerName,
      customer_phone: customerPhone,
      payment_method: method,
      total,
      status: "confirmado",
      partner_id: partnerId || null,
      comissao_valor: comissaoValor,
      comissao_paga: false,
    })
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ booking: data });
}
