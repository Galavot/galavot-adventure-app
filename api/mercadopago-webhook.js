// api/mercadopago-webhook.js
//
// O Mercado Pago chama essa URL sozinho toda vez que o status de um
// pagamento muda (aprovado, recusado, etc). É isso que faz a reserva virar
// "confirmado" de verdade — nunca confiamos só no navegador do cliente
// voltando pra tela de sucesso, porque isso pode ser manipulado.
//
// SEGURANÇA: não confiamos no corpo da notificação em si (qualquer um
// poderia mandar um POST fake pra essa URL dizendo "pagamento aprovado").
// Em vez disso, pegamos só o ID do pagamento que a notificação informa e
// buscamos os dados de verdade direto na API do Mercado Pago, usando a
// nossa própria chave secreta — só confiamos nessa resposta oficial deles.
//
// Quando o pagamento é aprovado, também manda um e-mail automático pro
// cliente com o código da reserva (usando o Resend, serviço gratuito até
// um certo volume de e-mails/mês) — assim o código não fica só na tela,
// que a pessoa pode fechar e perder.

import { createClient } from "@supabase/supabase-js";

async function sendConfirmationEmail(booking) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey || !booking.customer_email) return;

  const dateLabel = new Date(booking.booking_date + "T12:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || "Galavot Adventure <onboarding@resend.dev>",
        to: booking.customer_email,
        subject: `Reserva confirmada — código ${booking.booking_code}`,
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2 style="color: #F2600C;">Tudo pronto pra aventura! 🏍️</h2>
            <p>Seu pagamento foi confirmado. Guarde esse código, ele autoriza seu embarque no dia do passeio:</p>
            <div style="background: #151311; color: #F2600C; font-family: monospace; font-size: 22px; font-weight: bold; padding: 16px; border-radius: 8px; text-align: center; margin: 16px 0;">
              ${booking.booking_code}
            </div>
            <p><strong>Passeio:</strong> ${booking.tour_name}<br/>
            <strong>Data:</strong> ${dateLabel}<br/>
            <strong>Horário:</strong> ${booking.booking_time}<br/>
            <strong>Pessoas:</strong> ${booking.participants}</p>
            <p>Qualquer dúvida, chama a gente no WhatsApp: (27) 99992-7056</p>
            <p style="color: #888; font-size: 12px; margin-top: 24px;">Galavot Adventure — Guarapari, ES</p>
          </div>
        `,
      }),
    });
  } catch (err) {
    // Se o e-mail falhar, não é motivo pra falhar o webhook inteiro — a
    // reserva já está confirmada de qualquer forma, o cliente ainda vê o
    // código na tela.
  }
}

export default async function handler(req, res) {
  // O Mercado Pago espera sempre um 200 rápido, mesmo se a gente não puder
  // processar agora — senão ele fica tentando de novo sem parar.
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(200).json({ ok: true });
  }

  const accessToken = process.env.MP_ACCESS_TOKEN;
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!accessToken || !supabaseUrl || !serviceKey) {
    return res.status(200).json({ ok: true });
  }

  // O ID do pagamento vem em formatos diferentes dependendo do tipo de
  // notificação que o Mercado Pago manda.
  const paymentId =
    req.body?.data?.id || req.query["data.id"] || req.query.id || req.body?.id || null;
  const topic = req.body?.type || req.query.type || req.query.topic;

  if (!paymentId || (topic && topic !== "payment")) {
    return res.status(200).json({ ok: true });
  }

  try {
    // Busca os dados OFICIAIS do pagamento direto na API do Mercado Pago —
    // é essa resposta que decide o que fazer, não o corpo da notificação.
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!mpRes.ok) return res.status(200).json({ ok: true });
    const payment = await mpRes.json();

    const bookingId = payment.external_reference;
    if (!bookingId) return res.status(200).json({ ok: true });

    let novoStatus = null;
    if (payment.status === "approved") novoStatus = "confirmado";
    else if (payment.status === "rejected" || payment.status === "cancelled") novoStatus = "pagamento_recusado";
    console.log(
      `[mp-webhook] paymentId=${paymentId} status=${payment.status} external_reference=${bookingId} novoStatus=${novoStatus}`
    );
    // "pending", "in_process" etc: deixa como está, o cliente ainda não
    // terminou de pagar.

    if (novoStatus) {
      const supabase = createClient(supabaseUrl, serviceKey);
      const { data: updated } = await supabase
        .from("bookings")
        .update({ status: novoStatus, mp_payment_id: String(payment.id) })
        .eq("id", bookingId)
        // Não regride uma reserva que já foi cancelada/concluída/etc por
        // engano se a notificação chegar atrasada ou duplicada.
        .in("status", ["pendente_pagamento", "confirmado", "pagamento_recusado"])
        .select()
        .single();

      if (novoStatus === "confirmado" && updated) {
        await sendConfirmationEmail(updated);
      }
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    // Mesmo em erro, devolve 200 — o Mercado Pago vai tentar de novo mais
    // tarde sozinho, e não queremos que ele nos marque como instáveis.
    return res.status(200).json({ ok: true });
  }
}
