// api/_mpConfirm.js
//
// Lógica compartilhada pra confirmar uma reserva verificando o pagamento
// direto na API do Mercado Pago. Usada em dois lugares:
//
// 1. api/mercadopago-webhook.js — quando o Mercado Pago avisa sozinho que
//    o pagamento mudou (o caminho ideal, mais rápido).
// 2. api/create-booking.js (GET) — como um plano B: toda vez que o
//    cliente está na tela "aguardando pagamento" e ela verifica o status
//    (a cada poucos segundos), a gente também pergunta direto pro
//    Mercado Pago "esse pagamento já foi aprovado?", em vez de confiar
//    cegamente que a notificação automática vai chegar a tempo (ou vai
//    chegar, ponto — às vezes ela atrasa muito ou nem chega).
//
// Isso deixa a confirmação funcionando mesmo se o webhook do Mercado
// Pago falhar ou demorar, sem esperar nada do navegador do cliente (a
// verificação sempre acontece no servidor, direto com a API oficial).

export async function sendConfirmationEmail(booking) {
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
    // Se o e-mail falhar, não é motivo pra travar o resto — a reserva já
    // está confirmada de qualquer forma, o cliente ainda vê o código na
    // tela.
  }
}

// Aplica a mudança de status no banco, dado um status novo já decidido
// (novoStatus). Retorna a linha atualizada (ou null se não achou/não
// mudou nada).
async function applyStatus(supabase, bookingId, novoStatus, paymentId) {
  const { data: updated, error: updateError } = await supabase
    .from("bookings")
    .update({ status: novoStatus, mp_payment_id: String(paymentId) })
    .eq("id", bookingId)
    // Não regride uma reserva que já foi cancelada/concluída/etc por
    // engano se a notificação chegar atrasada ou duplicada.
    .in("status", ["pendente_pagamento", "confirmado", "pagamento_recusado"])
    .select()
    .single();

  console.log(
    `[mp-confirm] update result: updated=${!!updated} error=${updateError ? updateError.message : "none"} booking_code=${updated?.booking_code || "?"}`
  );

  if (novoStatus === "confirmado" && updated) {
    await sendConfirmationEmail(updated);
  }

  return updated || null;
}

// Dado um objeto "payment" já retornado pela API do Mercado Pago, decide
// o novo status e aplica no banco. Usado pelo webhook, que já tem o
// paymentId em mãos.
export async function confirmFromPayment(supabase, payment) {
  const bookingId = payment.external_reference;
  if (!bookingId) return null;

  let novoStatus = null;
  if (payment.status === "approved") novoStatus = "confirmado";
  else if (payment.status === "rejected" || payment.status === "cancelled") novoStatus = "pagamento_recusado";

  console.log(
    `[mp-confirm] paymentId=${payment.id} status=${payment.status} external_reference=${bookingId} novoStatus=${novoStatus}`
  );

  if (!novoStatus) return null;
  return applyStatus(supabase, bookingId, novoStatus, payment.id);
}

// Plano B: dado o ID de uma reserva que ainda está "pendente_pagamento",
// pergunta direto pro Mercado Pago se já existe algum pagamento
// aprovado/recusado associado a ela (via busca por external_reference),
// sem depender de nenhuma notificação ter chegado. Retorna a reserva
// atualizada se algo mudou, ou null se ainda não há nada de novo.
export async function checkPendingBookingDirectly(supabase, booking) {
  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken || !booking?.id || booking.status !== "pendente_pagamento") return null;

  try {
    const searchRes = await fetch(
      `https://api.mercadopago.com/v1/payments/search?external_reference=${encodeURIComponent(booking.id)}&sort=date_created&criteria=desc`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!searchRes.ok) return null;
    const data = await searchRes.json();
    const payment = data?.results?.[0];
    if (!payment) return null;

    return await confirmFromPayment(supabase, payment);
  } catch (err) {
    // Falha na checagem direta não deve derrubar a tela do cliente — ela
    // vai tentar de novo no próximo polling.
    return null;
  }
}
