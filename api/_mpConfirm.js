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
  // SEGURANÇA CONTRA E-MAIL DUPLICADO: o Mercado Pago costuma mandar a
  // mesma notificação de pagamento mais de uma vez (comportamento normal
  // dele, não é falha nossa). Por isso a transição só é aceita vindo de
  // "pendente_pagamento" — nunca de um status que já é igual ao novo (ex:
  // reserva já "confirmado" recebendo outra notificação de "aprovado" não
  // deve reconfirmar e reenviar e-mail).
  const { data: updated, error: updateError } = await supabase
    .from("bookings")
    .update({ status: novoStatus })
    .eq("id", bookingId)
    .eq("status", "pendente_pagamento")
    .select()
    .single();

  console.log(
    `[mp-confirm] update result: updated=${!!updated} error=${updateError ? updateError.message : "none"} booking_code=${updated?.booking_code || "?"}`
  );

  // Guarda o ID do pagamento do Mercado Pago separadamente — se essa
  // coluna não existir ainda na tabela (ou qualquer outro problema aqui),
  // não pode travar a confirmação em si, que já é o que importa.
  if (updated) {
    supabase
      .from("bookings")
      .update({ mp_payment_id: String(paymentId) })
      .eq("id", bookingId)
      .then(() => {})
      .catch(() => {});
  }

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
    const searchUrl = `https://api.mercadopago.com/v1/payments/search?external_reference=${encodeURIComponent(booking.id)}&sort=date_created&criteria=desc`;
    const searchRes = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!searchRes.ok) {
      const bodyText = await searchRes.text().catch(() => "");
      console.log(
        `[mp-confirm] search failed: status=${searchRes.status} booking_id=${booking.id} body=${bodyText.slice(0, 300)}`
      );
      return null;
    }

    const data = await searchRes.json();
    const payment = data?.results?.[0];
    console.log(
      `[mp-confirm] search result: booking_id=${booking.id} results_count=${data?.results?.length ?? 0} first_payment_status=${payment?.status ?? "none"}`
    );
    if (!payment) return null;

    return await confirmFromPayment(supabase, payment);
  } catch (err) {
    console.log(`[mp-confirm] search threw error: booking_id=${booking?.id} error=${err?.message}`);
    return null;
  }
}
