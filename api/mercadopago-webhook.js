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
import { confirmFromPayment } from "./_mpConfirm.js";

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

    const supabase = createClient(supabaseUrl, serviceKey);
    await confirmFromPayment(supabase, payment);

    return res.status(200).json({ ok: true });
  } catch (err) {
    // Mesmo em erro, devolve 200 — o Mercado Pago vai tentar de novo mais
    // tarde sozinho, e não queremos que ele nos marque como instáveis.
    return res.status(200).json({ ok: true });
  }
}
