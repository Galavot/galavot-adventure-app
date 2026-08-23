// src/lib/mercadoPago.js
//
// Carrega o SDK oficial do Mercado Pago (mercadopago.js v2) sob demanda,
// só quando o cliente escolhe pagar com cartão — não faz sentido carregar
// esse script em toda visita ao site. O SDK é quem faz a tokenização do
// cartão: os dados sensíveis (número, CVV) saem direto do navegador do
// cliente pra API do Mercado Pago, sem passar pelo nosso servidor.

let sdkPromise = null;

function loadScript() {
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise((resolve, reject) => {
    if (window.MercadoPago) {
      resolve(window.MercadoPago);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://sdk.mercadopago.com/js/v2";
    script.onload = () => resolve(window.MercadoPago);
    script.onerror = () => reject(new Error("Não foi possível carregar o Mercado Pago."));
    document.head.appendChild(script);
  });
  return sdkPromise;
}

let mpInstance = null;

export async function getMp() {
  if (mpInstance) return mpInstance;
  const publicKey = import.meta.env.VITE_MP_PUBLIC_KEY;
  if (!publicKey) {
    throw new Error("Pagamento com cartão ainda não está configurado (VITE_MP_PUBLIC_KEY ausente).");
  }
  const MercadoPago = await loadScript();
  mpInstance = new MercadoPago(publicKey, { locale: "pt-BR" });
  return mpInstance;
}

// Descobre a bandeira do cartão (visa, master, elo, amex...) a partir dos
// primeiros 6 dígitos — o Mercado Pago exige isso separado do token.
export async function detectCardBrand(cardNumberDigits) {
  const mp = await getMp();
  const bin = cardNumberDigits.slice(0, 6);
  const result = await mp.getPaymentMethods({ bin });
  const first = result?.results?.[0];
  if (!first) throw new Error("Não reconhecemos essa bandeira de cartão.");
  return first.id; // ex: "visa", "master", "elo"
}

// Gera o token seguro do cartão — só esse token vai pro nosso servidor,
// nunca o número real do cartão.
export async function createCardToken({ cardNumber, cardholderName, month, year, cvv, cpfDigits }) {
  const mp = await getMp();
  const token = await mp.createCardToken({
    cardNumber,
    cardholderName,
    cardExpirationMonth: month,
    cardExpirationYear: year.length === 2 ? `20${year}` : year,
    securityCode: cvv,
    identificationType: "CPF",
    identificationNumber: cpfDigits,
  });
  if (!token?.id) {
    throw new Error("Não foi possível validar os dados do cartão. Confira os números e tente de novo.");
  }
  return token.id;
}
