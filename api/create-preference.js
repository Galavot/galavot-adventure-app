// api/create-preference.js
//
// Função serverless (roda na Vercel, não no navegador do cliente).
// Recebe os dados da reserva e cria uma "preferência de pagamento" no
// Mercado Pago, retornando o link de checkout (init_point) para redirecionar
// o cliente.
//
// Pré-requisitos:
// 1. Criar conta em https://www.mercadopago.com.br
// 2. Pegar o Access Token em: Seu negócio > Configurações > Credenciais
// 3. Adicionar a variável de ambiente MP_ACCESS_TOKEN no projeto da Vercel
//    (Project Settings > Environment Variables)

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

  const { tourName, amount, description, payerName } = req.body;

  if (!tourName || !amount) {
    return res.status(400).json({ error: "Dados da reserva incompletos" });
  }

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
            title: description || tourName,
            quantity: 1,
            unit_price: Number(amount),
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
