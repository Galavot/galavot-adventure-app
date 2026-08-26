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

import { TOURS } from "../src/data.js";
import { getMaxQuadriciclos } from "./_slots.js";

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

async function sendEmail(booking, subject, html) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey || !booking.customer_email) return;

  try {
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || "Galavot Adventure <onboarding@resend.dev>",
        to: booking.customer_email,
        subject,
        html,
      }),
    });

    // O fetch em si não lança erro quando o Resend RECUSA o envio (limite
    // atingido, destinatário inválido, etc) — ele só devolve um status de
    // erro dentro da resposta normal. Sem checar isso, uma falha de envio
    // ficava completamente invisível, sem nenhum log pra investigar depois.
    if (!resendRes.ok) {
      const errorBody = await resendRes.text().catch(() => "");
      console.log(
        `[resend] falha ao enviar e-mail booking_code=${booking.booking_code} to=${booking.customer_email} status=${resendRes.status} body=${errorBody}`
      );
    }
  } catch (err) {
    console.log(
      `[resend] erro de rede ao enviar e-mail booking_code=${booking.booking_code} to=${booking.customer_email}: ${err.message}`
    );
    // Se o e-mail falhar, não é motivo pra travar o resto — a reserva já
    // teve o status atualizado de qualquer forma.
  }
}

export async function sendConfirmationEmail(booking) {
  const dateLabel = new Date(booking.booking_date + "T12:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  await sendEmail(
    booking,
    `Reserva confirmada — código ${booking.booking_code}`,
    `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #F2600C;">Tudo pronto pra aventura!</h2>
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
    `
  );
}

// E-mail pro caso raro de CONFLITO DE VAGA: o pagamento chegou aprovado
// depois da reserva já ter expirado por demora (mais de 20min), e nesse
// meio tempo a vaga foi vendida pra outra pessoa. O dinheiro já foi
// capturado, mas não dá pra simplesmente confirmar — precisa de contato
// humano pra resolver (reembolso ou realocar pra outra data/horário).
async function sendConflictEmail(booking) {
  await sendEmail(
    booking,
    `Sobre sua reserva ${booking.booking_code} — precisamos falar com você`,
    `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #F2600C;">Recebemos seu pagamento</h2>
        <p>Identificamos seu pagamento da reserva <strong>${booking.booking_code}</strong>, mas o horário escolhido
        (${booking.tour_name}, ${booking.booking_date} às ${booking.booking_time}) já não tem mais vaga disponível —
        isso pode acontecer quando o pagamento demora mais que o normal pra ser aprovado.</p>
        <p>Fica tranquilo(a): seu dinheiro está garantido. Vamos entrar em contato em breve pra resolver, seja
        reagendando pra outro horário ou fazendo o reembolso, o que preferir.</p>
        <p>Se quiser adiantar, chama a gente no WhatsApp: (27) 99992-7056</p>
        <p style="color: #888; font-size: 12px; margin-top: 24px;">Galavot Adventure — Guarapari, ES</p>
      </div>
    `
  );
}

// Aplica a mudança de status no banco, dado um status novo já decidido
// (novoStatus). Retorna a linha atualizada (ou null se não achou/não
// mudou nada).
async function applyStatus(supabase, bookingId, novoStatus, paymentId) {
  if (novoStatus !== "confirmado") {
    // Caminho simples: rejeição/cancelamento só é aceito vindo de
    // "pendente_pagamento" (nunca regride algo que já mudou de status).
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

    if (updated) {
      supabase
        .from("bookings")
        .update({ mp_payment_id: String(paymentId) })
        .eq("id", bookingId)
        .then(() => {})
        .catch(() => {});
    }

    return updated || null;
  }

  // CONFIRMAÇÃO: tenta primeiro o caminho normal (vindo de
  // "pendente_pagamento"). SEGURANÇA CONTRA E-MAIL DUPLICADO: nunca
  // reconfirma algo que já está "confirmado" (o Mercado Pago manda
  // notificação duplicada às vezes) — por isso o .eq exato, não .in.
  const { data: normalUpdate } = await supabase
    .from("bookings")
    .update({ status: "confirmado" })
    .eq("id", bookingId)
    .eq("status", "pendente_pagamento")
    .select()
    .single();

  if (normalUpdate) {
    console.log(`[mp-confirm] update result: updated=true error=none booking_code=${normalUpdate.booking_code}`);
    supabase
      .from("bookings")
      .update({ mp_payment_id: String(paymentId) })
      .eq("id", bookingId)
      .then(() => {})
      .catch(() => {});
    await sendConfirmationEmail(normalUpdate);
    return normalUpdate;
  }

  // Não achou como "pendente_pagamento" — pode ser: (a) já está
  // confirmado/cancelado/etc (notificação duplicada/tardia, ignora em
  // silêncio), ou (b) foi expirada automaticamente por demora
  // (pagamento_recusado) e esse pagamento é uma RECUPERAÇÃO TARDIA.
  const { data: expired } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .eq("status", "pagamento_recusado")
    .single();

  if (!expired) {
    console.log(`[mp-confirm] update result: updated=false error=none (já não estava mais pendente nem expirada)`);
    return null;
  }

  // RECUPERAÇÃO TARDIA: confere se a vaga ainda está livre antes de
  // confirmar — nesse meio tempo alguém pode ter comprado a mesma vaga.
  const tour = TOURS.find((t) => t.id === expired.tour_id);
  const maxQuadriciclos = await getMaxQuadriciclos(supabase, tour);

  const { count } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("tour_id", expired.tour_id)
    .eq("booking_date", expired.booking_date)
    .not("status", "in", "(cancelado,pagamento_recusado)")
    .neq("id", bookingId);

  const vagaLivre = (count || 0) < maxQuadriciclos;

  console.log(
    `[mp-confirm] RECUPERAÇÃO TARDIA booking_code=${expired.booking_code} vaga_livre=${vagaLivre} ocupadas=${count}/${maxQuadriciclos}`
  );

  if (vagaLivre) {
    const { data: recovered } = await supabase
      .from("bookings")
      .update({ status: "confirmado" })
      .eq("id", bookingId)
      .eq("status", "pagamento_recusado")
      .select()
      .single();

    if (recovered) {
      supabase
        .from("bookings")
        .update({ mp_payment_id: String(paymentId) })
        .eq("id", bookingId)
        .then(() => {})
        .catch(() => {});
      await sendConfirmationEmail(recovered);
    }
    return recovered || null;
  }

  // CONFLITO DE VERDADE: pagou, mas a vaga já foi pra outra pessoa.
  // Marca um status próprio (nunca confunde com uma reserva comum) e
  // avisa o cliente que a equipe vai entrar em contato.
  const { data: conflito } = await supabase
    .from("bookings")
    .update({ status: "conflito_vaga" })
    .eq("id", bookingId)
    .eq("status", "pagamento_recusado")
    .select()
    .single();

  if (conflito) {
    console.log(`[mp-confirm] ⚠️ CONFLITO DE VAGA registrado: booking_code=${conflito.booking_code} — resolver manualmente no admin`);
    supabase
      .from("bookings")
      .update({ mp_payment_id: String(paymentId) })
      .eq("id", bookingId)
      .then(() => {})
      .catch(() => {});
    await sendConflictEmail(conflito);
  }
  return conflito || null;
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
