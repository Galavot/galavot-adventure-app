// api/create-booking.js
//
// POST -> Salva a reserva no banco de dados (Supabase) assim que o cliente
// confirma no site. É essa peça que faz o painel /admin conseguir listar
// as reservas. A reserva nasce como "pendente_pagamento" — só vira
// "confirmado" quando o webhook do Mercado Pago avisa que o pagamento caiu
// de verdade (ver api/mercadopago-webhook.js).
//
// GET  -> busca uma reserva pelo código (?code=GLV-1234), só com os dados
// necessários pra tela de confirmação. Usado quando o cliente volta do
// Mercado Pago (a página recarrega do zero nesse retorno, então não dá
// pra confiar em nada guardado só na memória do navegador).
//
// Se a reserva foi feita por um parceiro logado (partnerId enviado), grava
// o vínculo e calcula a comissão automaticamente (comissao_percentual do
// parceiro, padrão 10%).
//
// SEGURANÇA: o valor da reserva (total) NUNCA é aceito como veio do
// navegador — é sempre recalculado aqui a partir do preço ATUAL do passeio.
// O preço vem da tabela "tour_prices" (editável no /admin) e, se não
// houver nenhum registrado lá, cai no padrão de src/data.js (TOURS). O
// limite de quadriciclos por turno também é reconferido aqui no servidor,
// não só na tela de escolha de data, pra evitar overbooking se duas
// pessoas reservarem ao mesmo tempo.
//
// PLANO DE PAGAMENTO: o cliente escolhe entre sinal de 50% (com o
// restante no embarque) ou pagamento à vista — o valor cobrado agora
// (valor_pago_inicial) é sempre calculado aqui, nunca aceito do navegador.
//
// LISTA TÉCNICA (auditoria): guarda quando o cliente abriu o manual, o
// termo, e quando marcou o aceite — usado no /admin pra provar, se
// necessário, que o fluxo foi seguido antes do pagamento. O IP vem do
// próprio servidor (não confia no que o navegador diz), e cada reserva
// ganha um código curto (ex: GLV-4821) pra identificar fácil na lista do
// guia e num eventual comprovante.
//
// Pré-requisitos (ver README):
// - Criar projeto gratuito em https://supabase.com
// - Rodar o SQL de criação da tabela "bookings" (está no README)
// - Configurar as variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY

import { createClient } from "@supabase/supabase-js";
import { TOURS } from "../src/data.js";
import { isValidCustomerName, isValidPhoneNumber } from "../src/utils/validation.js";
import { checkPendingBookingDirectly } from "./_mpConfirm.js";
import { getClientIp as getRateLimitIp, checkRateLimit, registerFailedAttempt } from "./_rateLimit.js";
import { isPastSameDayCutoff } from "./_brazilTime.js";
import { expireStalePendingBookings } from "./_bookingExpiry.js";
import { getMaxQuadriciclos } from "./_slots.js";
import { isDateBlocked } from "./_blockedDates.js";

function getClientIp(req) {
  const fwd = req.headers["x-forwarded-for"];
  if (fwd) return fwd.split(",")[0].trim();
  return req.socket?.remoteAddress || "desconhecido";
}

function generateBookingCode() {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `GLV-${n}`;
}

export default async function handler(req, res) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({
      error: "Banco de dados não configurado. Veja o README para configurar o Supabase.",
    });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  if (req.method === "GET") {
    const code = String(req.query.code || "").trim();
    const phone = String(req.query.phone || "").trim();

    if (!code && !phone) {
      return res.status(400).json({ error: "Código ou telefone são obrigatórios" });
    }

    const selectFields =
      "id, booking_code, tour_id, tour_name, booking_date, booking_time, participants, customer_name, customer_phone, customer_email, payment_method, payment_plan, total, valor_pago_inicial, status";

    // Busca por telefone: usada pela tela "Minhas Reservas" do cliente, que
    // não tem login — o próprio telefone usado na reserva é a chave de
    // busca. Devolve a lista (mais recentes primeiro), sem checar o
    // Mercado Pago de novo (é só listagem, não uma tela de pagamento
    // pendente).
    //
    // SEGURANÇA: exige o telefone COMPLETO (DDD + número, 10 ou 11
    // dígitos) e faz correspondência EXATA — não por sufixo. Um match
    // parcial (ex: só os últimos 8 dígitos) podia acidentalmente devolver
    // a reserva de outra pessoa cujo número termina igual. Também aplica
    // o mesmo limite de tentativas do login (8 buscas / 15min por IP),
    // pra dificultar alguém varrer números tentando coletar dados de
    // clientes.
    if (phone && !code) {
      const digitsOnly = phone.replace(/\D/g, "");
      if (digitsOnly.length < 10) {
        return res.status(400).json({ error: "Digite o telefone completo, com DDD." });
      }

      const ip = getRateLimitIp(req);
      const { blocked, retryAfterMinutes } = await checkRateLimit(supabase, ip, "phone-search");
      if (blocked) {
        return res.status(429).json({
          error: `Muitas buscas seguidas. Tente novamente em ${retryAfterMinutes} minutos.`,
        });
      }
      await registerFailedAttempt(supabase, ip, "phone-search");

      // Reservas confirmadas/concluídas somem da lista depois de 3 meses
      // (a pessoa não precisa ver passeio de meio ano atrás toda vez que
      // abre o app). Tentativas que não deram certo (pendente/recusada/
      // conflito) somem bem mais rápido, em 24h — depois disso é só ruído
      // de uma tentativa de pagamento que falhou, não uma reserva de
      // verdade que a pessoa precise continuar vendo.
      const THREE_MONTHS_MS = 90 * 24 * 60 * 60 * 1000;
      const ONE_DAY_MS = 24 * 60 * 60 * 1000;
      const cutoff3Months = new Date(Date.now() - THREE_MONTHS_MS).toISOString();
      const NOISY_STATUSES = ["pendente_pagamento", "pagamento_recusado", "conflito_vaga"];

      const { data, error } = await supabase
        .from("bookings")
        .select(selectFields + ", created_at")
        // Nada com mais de 3 meses interessa em nenhum caso — filtra isso
        // já no banco, não só na hora de exibir, pra não puxar reserva
        // antiga demais desnecessariamente.
        .gte("created_at", cutoff3Months)
        .order("created_at", { ascending: false });

      if (error) return res.status(500).json({ error: error.message });

      const bookings = (data || []).filter((b) => {
        if ((b.customer_phone || "").replace(/\D/g, "") !== digitsOnly) return false;
        if (NOISY_STATUSES.includes(b.status)) {
          return new Date(b.created_at).getTime() >= Date.now() - ONE_DAY_MS;
        }
        return true;
      });

      return res.status(200).json({ bookings });
    }

    const { data, error } = await supabase
      .from("bookings")
      .select(selectFields)
      .eq("booking_code", code)
      .single();

    if (error || !data) return res.status(404).json({ error: "Reserva não encontrada" });

    // Plano B: se ainda está "pendente_pagamento", pergunta direto pro
    // Mercado Pago se já tem um pagamento aprovado — não fica só esperando
    // a notificação automática chegar, que às vezes atrasa ou falha.
    if (data.status === "pendente_pagamento") {
      const updated = await checkPendingBookingDirectly(supabase, data);
      if (updated) return res.status(200).json({ booking: updated });
    }

    return res.status(200).json({ booking: data });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const {
    tourId,
    date,
    time,
    participants,
    customerName,
    customerPhone,
    customerEmail,
    method,
    partnerId,
    manualVistoEm,
    termoVistoEm,
    aceiteEm,
    paymentPlan,
  } = req.body;

  if (!tourId || !time || !customerName || !date) {
    return res.status(400).json({ error: "Dados da reserva incompletos" });
  }

  // Mesma checagem do formulário, refeita aqui no servidor — impede que
  // alguém contorne a validação da tela mandando a reserva direto pra API
  // com nome/telefone inventados (ex: "Cghuu", "11111111111221").
  if (!isValidCustomerName(customerName)) {
    return res.status(400).json({ error: "Informe um nome completo válido (nome e sobrenome)." });
  }
  if (!isValidPhoneNumber(customerPhone)) {
    return res.status(400).json({ error: "Informe um WhatsApp válido, com DDD." });
  }

  // O passeio precisa existir na lista oficial — nunca confiamos em
  // tourName/total vindos do cliente.
  const tour = TOURS.find((t) => t.id === tourId);
  if (!tour) {
    return res.status(400).json({ error: "Passeio inválido" });
  }

  const plan = paymentPlan === "vista" ? "vista" : "sinal";
  const tourName = tour.name;
  // Vagas por turno ATUAIS (pode ter sido alterado no /admin, aba PREÇOS —
  // ex: quadriciclo novo aumentando vaga, ou um em manutenção reduzindo).
  const maxQuadriciclos = await getMaxQuadriciclos(supabase, tour);

  // Corte de reserva de última hora: pro passeio de HOJE, não aceita mais
  // reserva depois do horário limite (mesmo que ainda tenha vaga), pra não
  // atrapalhar o preparo/saída do grupo. Checado no servidor pra não
  // depender só da tela ter bloqueado o botão.
  if (isPastSameDayCutoff(tour, date)) {
    const cutoffLabel = `${String(tour.cutoffHour).padStart(2, "0")}h`;
    return res.status(409).json({
      error: `Reservas pro ${tour.name.toLowerCase()} de hoje já encerraram (até ${cutoffLabel}). Escolha outra data.`,
    });
  }

  // Data bloqueada manualmente pelo Sid (aba PREÇOS do /admin) — checado
  // no servidor pra valer tanto pro app quanto pra reserva feita por
  // parceiro, e pra não dar brecha se alguém tentar forçar via API.
  if (await isDateBlocked(supabase, tourId, date)) {
    return res.status(409).json({
      error: `Não estamos vendendo o ${tour.name.toLowerCase()} nessa data. Escolha outro dia.`,
    });
  }

  // Busca o preço ATUAL desse passeio (pode ter sido alterado no /admin
  // desde a última vez que o código foi publicado).
  const { data: priceRow } = await supabase
    .from("tour_prices")
    .select("price")
    .eq("tour_id", tourId)
    .single();
  const total = priceRow?.price ? Number(priceRow.price) : tour.price;
  const valorPagoInicial = plan === "vista" ? total : Math.round(total * 0.5 * 100) / 100;

  // Reconfere disponibilidade no momento de salvar, e não só na tela
  // anterior — reduz a janela de overbooking quando duas pessoas reservam
  // ao mesmo tempo o último horário disponível.
  //
  // Libera de volta pra venda qualquer reserva pendente há mais de 20min
  // nesse mesmo passeio/data, antes de contar quantas vagas já estão
  // ocupadas — senão alguém que desistiu no meio do pagamento poderia
  // travar a vaga pra sempre.
  await expireStalePendingBookings(supabase, tourId, date);

  const { count, error: countError } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("tour_id", tourId)
    .eq("booking_date", date)
    .not("status", "in", "(cancelado,pagamento_recusado)");

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
      booking_code: generateBookingCode(),
      tour_id: tourId,
      tour_name: tourName,
      booking_date: date,
      booking_time: time,
      participants,
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_email: customerEmail || null,
      payment_method: method,
      payment_plan: plan,
      total,
      valor_pago_inicial: valorPagoInicial,
      status: "pendente_pagamento",
      partner_id: partnerId || null,
      comissao_valor: comissaoValor,
      comissao_paga: false,
      manual_visto_em: manualVistoEm || null,
      termo_visto_em: termoVistoEm || null,
      aceite_em: aceiteEm || null,
      ip: getClientIp(req),
    })
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ booking: data });
}
