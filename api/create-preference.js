// api/create-preference.js
//
// Processa o pagamento de uma reserva já salva (nasceu como
// "pendente_pagamento" em api/create-booking.js). O comportamento muda de
// acordo com o método escolhido:
//
// - "pix": gera o pagamento Pix DIRETO na nossa API (Checkout API do
//   Mercado Pago), sem redirecionar o cliente pra nenhuma página externa.
//   Devolve o QR Code (imagem em base64) e o código "copia e cola" pra
//   exibir dentro do próprio app.
// - "credito" / "debito": recebe um TOKEN de cartão já gerado no navegador
//   do cliente pelo SDK oficial do Mercado Pago (mp.createCardToken) — o
//   número do cartão em si NUNCA passa pelo nosso servidor, só esse token
//   seguro. Cobra 1x à vista, sem parcelamento.
// - "transferencia": mantém o fluxo antigo (Checkout Pro), redirecionando
//   o cliente pra uma página hospedada pelo Mercado Pago — não existe uma
//   forma de automatizar transferência bancária direto via API pública
//   deles, então esse método continua manual como já era.
//
// SEGURANÇA: o valor cobrado (transaction_amount) NUNCA é aceito como veio
// do navegador — é sempre recalculado aqui a partir do preço ATUAL do
// passeio (tabela "tour_prices", com fallback pro padrão em src/data.js).
//
// COMPLIANCE: pagamentos Pix e cartão via API direta do Mercado Pago
// exigem o CPF do pagador (exigência do Banco Central pra prevenção de
// fraude) — por isso o formulário de dados do cliente agora pede CPF.
//
// Pré-requisitos:
// 1. Criar conta em https://www.mercadopago.com.br
// 2. Pegar o Access Token (privado) em: Seu negócio > Configurações > Credenciais
// 3. Pegar a Public Key (pública, vai no frontend) na mesma tela
// 4. Variáveis de ambiente na Vercel: MP_ACCESS_TOKEN, SITE_URL, e
//    VITE_MP_PUBLIC_KEY (essa última também precisa existir no ambiente de
//    BUILD, não só runtime, porque vai embutida no código do navegador)

import { createClient } from "@supabase/supabase-js";
import { TOURS } from "../src/data.js";
import { confirmFromPayment } from "./_mpConfirm.js";

function getSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return null;
  return createClient(supabaseUrl, serviceKey);
}

async function getCurrentPrice(supabase, tourId, tour) {
  if (!supabase) return tour.price;
  const { data: priceRow } = await supabase.from("tour_prices").select("price").eq("tour_id", tourId).single();
  return priceRow?.price ? Number(priceRow.price) : tour.price;
}

function splitName(fullName) {
  const parts = (fullName || "").trim().split(/\s+/);
  const first_name = parts[0] || "Cliente";
  const last_name = parts.slice(1).join(" ") || "Galavot";
  return { first_name, last_name };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    return res.status(500).json({
      error: "MP_ACCESS_TOKEN não configurado. Veja o README para configurar o Mercado Pago.",
    });
  }

  const {
    tourId,
    payerName,
    payerEmail,
    payerCpf,
    paymentPlan,
    bookingId,
    bookingCode,
    method,
    // Só usados quando method é "credito" ou "debito":
    cardToken,
    cardPaymentMethodId,
  } = req.body;

  if (!bookingId || !bookingCode) {
    return res.status(400).json({ error: "Reserva não informada" });
  }

  const tour = TOURS.find((t) => t.id === tourId);
  if (!tour) {
    return res.status(400).json({ error: "Passeio inválido" });
  }

  const supabase = getSupabase();
  const total = await getCurrentPrice(supabase, tourId, tour);
  const plan = paymentPlan === "vista" ? "vista" : "sinal";
  const amount = plan === "vista" ? total : Math.round(total * 0.5 * 100) / 100;
  const siteUrl = (process.env.SITE_URL || "").replace(/\/$/, "");
  const { first_name, last_name } = splitName(payerName);
  const cpfDigits = (payerCpf || "").replace(/\D/g, "");

  // === MÉTODO: TRANSFERÊNCIA BANCÁRIA — mantém o fluxo antigo (Checkout
  // Pro, redireciona pra página do Mercado Pago) ===
  if (method === "transferencia") {
    try {
      const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          items: [
            {
              title: plan === "vista" ? `À vista - ${tour.name}` : `Sinal (50%) - ${tour.name}`,
              quantity: 1,
              unit_price: amount,
              currency_id: "BRL",
            },
          ],
          payer: { name: payerName || undefined, email: payerEmail || undefined },
          external_reference: bookingId,
          notification_url: `${siteUrl}/api/mercadopago-webhook`,
          back_urls: {
            success: `${siteUrl}/confirmacao/${bookingCode}`,
            failure: `${siteUrl}/passeio/${tourId}/pagamento`,
            pending: `${siteUrl}/confirmacao/${bookingCode}`,
          },
          auto_return: "approved",
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        return res.status(response.status).json({ error: data.message || "Erro no Mercado Pago" });
      }
      return res.status(200).json({ init_point: data.init_point, preference_id: data.id });
    } catch (err) {
      return res.status(500).json({ error: "Erro ao conectar com o Mercado Pago" });
    }
  }

  // === MÉTODOS DIRETOS (Pix, Crédito, Débito): Checkout API, sem
  // redirecionar pra fora do app ===

  if (!cpfDigits || cpfDigits.length !== 11) {
    return res.status(400).json({ error: "CPF do pagador é obrigatório e precisa ter 11 dígitos." });
  }

  const paymentBody = {
    transaction_amount: amount,
    description: `${plan === "vista" ? "À vista" : "Sinal (50%)"} - ${tour.name}`,
    external_reference: bookingId,
    notification_url: `${siteUrl}/api/mercadopago-webhook`,
    payer: {
      email: payerEmail || undefined,
      first_name,
      last_name,
      identification: { type: "CPF", number: cpfDigits },
    },
  };

  if (method === "pix") {
    paymentBody.payment_method_id = "pix";
  } else if (method === "credito" || method === "debito") {
    if (!cardToken || !cardPaymentMethodId) {
      return res.status(400).json({ error: "Dados do cartão incompletos." });
    }
    paymentBody.token = cardToken;
    paymentBody.payment_method_id = cardPaymentMethodId;
    paymentBody.installments = 1; // sempre à vista, sem parcelamento
  } else {
    return res.status(400).json({ error: "Método de pagamento inválido." });
  }

  try {
    const response = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        // Evita cobrar duas vezes se o navegador do cliente reenviar a
        // mesma requisição (ex: clique duplo, retry de rede).
        "X-Idempotency-Key": `${bookingId}-${method}`,
      },
      body: JSON.stringify(paymentBody),
    });

    const data = await response.json();

    if (!response.ok) {
      console.log(`[create-preference] Mercado Pago recusou: status=${response.status} body=${JSON.stringify(data).slice(0, 500)}`);
      return res.status(response.status).json({
        error: data.message || data.cause?.[0]?.description || "Pagamento recusado pelo Mercado Pago.",
      });
    }

    // PIX: guarda o QR Code na própria reserva, pra tela de retorno
    // conseguir mostrar mesmo depois de recarregar a página do zero.
    if (method === "pix" && supabase) {
      const poi = data.point_of_interaction?.transaction_data;
      await supabase
        .from("bookings")
        .update({
          pix_qr_code: poi?.qr_code || null,
          pix_qr_code_base64: poi?.qr_code_base64 || null,
        })
        .eq("id", bookingId);
    }

    // CRÉDITO/DÉBITO: pagamento com cartão costuma resolver na hora
    // (approved/rejected), então já aplicamos o resultado agora mesmo, sem
    // esperar o webhook chegar — o cliente vê o resultado imediatamente.
    // O webhook ainda vai chegar depois, mas nossa proteção contra
    // duplicidade já garante que ele não faz nada de novo.
    if ((method === "credito" || method === "debito") && supabase && data.status) {
      await confirmFromPayment(supabase, data);
    }

    return res.status(200).json({
      status: data.status,
      status_detail: data.status_detail,
      payment_id: data.id,
    });
  } catch (err) {
    console.log(`[create-preference] erro ao chamar Mercado Pago: ${err.message}`);
    return res.status(500).json({ error: "Erro ao conectar com o Mercado Pago" });
  }
}
