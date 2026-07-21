// api/create-preference.js
//
// Função serverless (roda na Vercel, não no navegador do cliente).
// Recebe os dados da reserva e cria uma "preferência de pagamento" no
// Mercado Pago, retornando o link de checkout (init_point) para redirecionar
// o cliente.
//
// SEGURANÇA: o valor cobrado (amount) NUNCA é aceito como veio do
// navegador — é sempre recalculado aqui a partir do preço oficial do
// passeio (TOURS, em src/data.js), igual já é feito em create-booking.js.
// Sem isso, alguém poderia manipular a requisição e pagar um valor menor
// que o real.
//
// Pré-requisitos:
// 1. Criar conta em https://www.mercadopago.com.br
// 2. Pegar o Access Token em: Seu negócio > Configurações > Credenciais
// 3. Adicionar a variável de ambiente MP_ACCESS_TOKEN no projeto da Vercel
//    (Project Settings > Environment Variables)

import { TOURS } from "../src/data.js";

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

  const { tourId, payerName } = req.body;

  const tour = TOURS.find((t) => t.id === tourId);
  if (!tour) {
    return res.status(400).json({ error: "Passeio inválido" });
  }

  const sinal = Math.round(tour.price * 0.5);

  try {
    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        items: [
          {
            title: `Sinal (50%) - ${tour.name}`,
            quantity: 1,
            unit_price: sinal,
            currency_id: "BRL",
          },
        ],
        payer: { name: payerName || undefined },
        back_urls: {
          success: `${process.env.SITE_URL || ""}/reservas`,
          failure: `${process.env.SITE_URL || ""}/`,
          pending: `${process.env.SITE_URL || ""}/reservas`,
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
