// api/create-booking.js
//
// Salva a reserva no banco de dados (Supabase) assim que o cliente confirma
// no site. É essa peça que faz o painel /admin conseguir listar as reservas.
//
// Se a reserva foi feita por um parceiro logado (partnerId enviado), grava
// o vínculo e calcula a comissão automaticamente (comissao_percentual do
// parceiro, padrão 10%).
//
// Pré-requisitos (ver README):
// - Criar projeto gratuito em https://supabase.com
// - Rodar o SQL de criação da tabela "bookings" (está no README)
// - Configurar as variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY

import { createClient } from "@supabase/supabase-js";

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

  const { tourId, tourName, date, time, participants, customerName, customerPhone, method, total, partnerId } =
    req.body;

  if (!tourName || !time || !customerName) {
    return res.status(400).json({ error: "Dados da reserva incompletos" });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  let comissaoValor = null;
  if (partnerId) {
    const { data: partner } = await supabase
      .from("partners")
      .select("comissao_percentual")
      .eq("id", partnerId)
      .single();
    const percentual = partner?.comissao_percentual ?? 10;
    comissaoValor = Math.round(Number(total) * (percentual / 100) * 100) / 100;
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
