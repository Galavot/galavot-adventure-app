import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CreditCard, Smartphone, AlertCircle, Landmark, Wallet, Check, ShieldCheck } from "lucide-react";
import { TopBar, TrailProgress, PrimaryButton } from "../components/UI.jsx";
import { TOURS } from "../data.js";
import { useBooking } from "../context/BookingContext.jsx";
import { usePrices } from "../context/PricesContext.jsx";
import { detectCardBrand, createCardToken } from "../lib/mercadoPago.js";

const PAYMENT_METHODS = [
  { key: "pix", label: "Pix", icon: Smartphone },
  { key: "credito", label: "Cartão de Crédito", icon: CreditCard },
  { key: "debito", label: "Cartão de Débito", icon: CreditCard },
  { key: "transferencia", label: "Transferência Bancária", icon: Landmark },
];

function formatCardNumber(v) {
  return v.replace(/\D/g, "").slice(0, 19).replace(/(\d{4})(?=\d)/g, "$1 ");
}

export default function BookingPayment() {
  const { id } = useParams();
  const navigate = useNavigate();
  const tour = TOURS.find((t) => t.id === id);
  const { prices } = usePrices();
  const {
    dates,
    selectedDateIndex,
    participants,
    selectedTime,
    method,
    setMethod,
    paymentPlan,
    setPaymentPlan,
    customer,
  } = useBooking();
  const [loading, setLoading] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState("");
  const [error, setError] = useState(null);

  // Campos do cartão (só usados quando method é credito/debito)
  const [card, setCard] = useState({ number: "", name: "", month: "", year: "", cvv: "" });
  const [cardTouched, setCardTouched] = useState(false);

  const total = prices[tour.id] ?? tour.price; // preço é por quadriciclo, não por pessoa
  const sinal = Math.round(total * 0.5 * 100) / 100;
  const restante = total - sinal;
  const valorAgora = paymentPlan === "vista" ? total : sinal;

  const cardNumberDigits = card.number.replace(/\D/g, "");
  const cardValid =
    cardNumberDigits.length >= 13 &&
    card.name.trim().length >= 3 &&
    /^(0[1-9]|1[0-2])$/.test(card.month) &&
    /^\d{2,4}$/.test(card.year) &&
    /^\d{3,4}$/.test(card.cvv);

  // 1. Salva a reserva no banco primeiro (nasce como "pendente_pagamento").
  // O servidor reconfere o limite de quadriciclos nesse momento — se
  // acabou de lotar, avisamos o cliente em vez de deixar ele achar que
  // reservou.
  const createBooking = async () => {
    const bookingRes = await fetch("/api/create-booking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tourId: tour.id,
        date: dates[selectedDateIndex].iso,
        time: selectedTime,
        participants,
        customerName: customer.name,
        customerPhone: customer.phone,
        customerEmail: customer.email,
        customerCpf: customer.cpf,
        method,
        paymentPlan,
        partnerId: sessionStorage.getItem("galavot_partner_id") || null,
        manualVistoEm: customer.manualVistoEm,
        termoVistoEm: customer.termoVistoEm,
        aceiteEm: customer.aceiteEm,
      }),
    });

    if (bookingRes.status === 409) {
      const data = await bookingRes.json();
      throw new Error(data.error || "Esse horário acabou de lotar. Volte e escolha outra data.");
    }
    if (!bookingRes.ok) throw new Error("Falha ao salvar a reserva");
    const { booking } = await bookingRes.json();
    return booking;
  };

  // Pix e Transferência: cria a reserva e processa o pagamento, depois
  // manda pra tela de confirmação (que mostra o QR Code do Pix, ou fica
  // aguardando no caso de transferência).
  const handlePixOrTransfer = async () => {
    setError(null);
    setLoading(true);
    setLoadingLabel(method === "pix" ? "GERANDO PIX..." : "REDIRECIONANDO...");
    try {
      const booking = await createBooking();

      const prefRes = await fetch("/api/create-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tourId: tour.id,
          payerName: customer.name,
          payerEmail: customer.email,
          payerCpf: customer.cpf,
          paymentPlan,
          bookingId: booking.id,
          bookingCode: booking.booking_code,
          method,
        }),
      });

      const data = await prefRes.json().catch(() => ({}));
      if (!prefRes.ok) throw new Error(data.error || "Falha ao processar o pagamento");

      if (method === "transferencia") {
        if (!data.init_point) throw new Error("Não recebemos o link de pagamento do Mercado Pago");
        window.location.href = data.init_point;
        return;
      }

      // Pix: a tela de confirmação já sabe mostrar o QR Code (guardado na
      // reserva) e ficar checando sozinha até o pagamento cair.
      navigate(`/confirmacao/${booking.booking_code}`);
    } catch (e) {
      setError(e.message || "Não foi possível processar o pagamento. Tente de novo.");
      setLoading(false);
    }
  };

  // Cartão: tokeniza direto no navegador (o número do cartão nunca passa
  // pelo nosso servidor), cria a reserva, e cobra à vista (1x).
  const handleCardPayment = async () => {
    setCardTouched(true);
    if (!cardValid) return;

    setError(null);
    setLoading(true);
    try {
      setLoadingLabel("VALIDANDO CARTÃO...");
      const cpfDigits = customer.cpf.replace(/\D/g, "");
      const cardPaymentMethodId = await detectCardBrand(cardNumberDigits);
      const cardToken = await createCardToken({
        cardNumber: cardNumberDigits,
        cardholderName: card.name.trim(),
        month: card.month,
        year: card.year,
        cvv: card.cvv,
        cpfDigits,
      });

      setLoadingLabel("SALVANDO RESERVA...");
      const booking = await createBooking();

      setLoadingLabel("PROCESSANDO PAGAMENTO...");
      const prefRes = await fetch("/api/create-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tourId: tour.id,
          payerName: customer.name,
          payerEmail: customer.email,
          payerCpf: customer.cpf,
          paymentPlan,
          bookingId: booking.id,
          bookingCode: booking.booking_code,
          method,
          cardToken,
          cardPaymentMethodId,
        }),
      });

      const data = await prefRes.json().catch(() => ({}));
      if (!prefRes.ok) throw new Error(data.error || "Pagamento recusado. Confira os dados do cartão.");

      if (data.status === "rejected") {
        throw new Error(
          "Seu cartão foi recusado pelo Mercado Pago. Confira os dados ou tente outro cartão/método."
        );
      }

      // approved ou in_process (alguns cartões demoram um pouco pra
      // confirmar) — a tela de confirmação resolve os dois casos.
      navigate(`/confirmacao/${booking.booking_code}`);
    } catch (e) {
      setError(e.message || "Não foi possível processar o pagamento com esse cartão.");
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (method === "credito" || method === "debito") {
      handleCardPayment();
    } else {
      handlePixOrTransfer();
    }
  };

  const isCard = method === "credito" || method === "debito";

  return (
    <div className="flex-1 overflow-y-auto bg-charcoal flex flex-col">
      <TopBar title="PAGAMENTO" showBack />
      <TrailProgress step={4} total={4} />
      <div className="px-4">
        <div className="flex items-center gap-2 mb-2 mt-1">
          <Wallet size={15} color="#F2600C" />
          <span className="font-display text-muted text-sm tracking-wide">COMO VOCÊ QUER PAGAR?</span>
        </div>
        <div className="flex flex-col gap-2 mb-4">
          <button
            onClick={() => setPaymentPlan("sinal")}
            className={`text-left rounded-lg px-4 py-3 border ${
              paymentPlan === "sinal" ? "bg-orange/10 border-orange" : "bg-stone border-hline"
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="text-[13px] font-semibold text-white">Sinal de 50% agora</span>
              {paymentPlan === "sinal" && (
                <span className="w-[18px] h-[18px] rounded-full bg-orange flex items-center justify-center">
                  <Check size={11} color="#151311" strokeWidth={3} />
                </span>
              )}
            </div>
            <div className="text-[11px] text-muted mt-0.5">
              R$ {sinal} agora · R$ {restante} no embarque
            </div>
          </button>

          <button
            onClick={() => setPaymentPlan("vista")}
            className={`text-left rounded-lg px-4 py-3 border ${
              paymentPlan === "vista" ? "bg-orange/10 border-orange" : "bg-stone border-hline"
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="text-[13px] font-semibold text-white">Pagar à vista</span>
              {paymentPlan === "vista" && (
                <span className="w-[18px] h-[18px] rounded-full bg-orange flex items-center justify-center">
                  <Check size={11} color="#151311" strokeWidth={3} />
                </span>
              )}
            </div>
            <div className="text-[11px] text-muted mt-0.5">R$ {total} agora · nada no embarque</div>
          </button>
        </div>

        <div className="rounded-xl p-4 bg-stone border border-hline">
          <div className="font-display text-white text-[15px]">RESUMO DO PEDIDO</div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-muted">{tour.name}</span>
            <span className="text-xs text-cream">{selectedTime} · {participants} pessoa(s)</span>
          </div>
          <div className="h-px my-3 bg-hline" />
          <div className="flex justify-between">
            <span className="text-xs text-muted">Total do passeio</span>
            <span className="text-xs text-cream">R$ {total}</span>
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-xs text-muted">{paymentPlan === "vista" ? "Pago agora" : "Sinal agora (50%)"}</span>
            <span className="font-display text-orange text-lg">R$ {valorAgora}</span>
          </div>
          {paymentPlan === "sinal" && (
            <div className="flex justify-between mt-1">
              <span className="text-xs text-muted">Restante no embarque (50%)</span>
              <span className="text-xs text-cream">R$ {restante}</span>
            </div>
          )}
        </div>

        <div className="font-display text-muted text-sm tracking-wide mt-4">FORMA DE PAGAMENTO</div>
        <div className="flex flex-col gap-2 mt-2">
          {PAYMENT_METHODS.map(({ key, label, icon: Icon }) => {
            const active = method === key;
            const sub =
              paymentPlan === "vista"
                ? `Pagamento à vista (R$ ${total})`
                : `Sinal de 50% agora (R$ ${sinal}) — restante no embarque`;
            return (
              <button
                key={key}
                onClick={() => setMethod(key)}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-left border ${
                  active ? "bg-orange border-orange" : "bg-stone border-hline"
                }`}
              >
                <Icon size={18} color={active ? "#151311" : "#F5F0E6"} />
                <div>
                  <div className={`font-display text-[15px] ${active ? "text-ink" : "text-white"}`}>{label}</div>
                  <div className={`text-[10px] ${active ? "text-ink" : "text-muted"}`}>{sub}</div>
                </div>
              </button>
            );
          })}
        </div>

        {isCard && (
          <div className="mt-3 rounded-xl p-4 bg-stone border border-hline flex flex-col gap-3">
            <div>
              <label className="text-[11px] font-semibold text-muted">NÚMERO DO CARTÃO</label>
              <input
                type="text"
                inputMode="numeric"
                value={card.number}
                onChange={(e) => setCard({ ...card, number: formatCardNumber(e.target.value) })}
                placeholder="0000 0000 0000 0000"
                className="w-full mt-1 rounded-lg px-4 py-3 bg-charcoal border border-hline text-white placeholder:text-muted outline-none focus:border-orange"
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-[11px] font-semibold text-muted">VALIDADE (MM/AA)</label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={2}
                    value={card.month}
                    onChange={(e) => setCard({ ...card, month: e.target.value.replace(/\D/g, "").slice(0, 2) })}
                    placeholder="MM"
                    className="w-1/2 rounded-lg px-3 py-3 bg-charcoal border border-hline text-white placeholder:text-muted outline-none focus:border-orange"
                  />
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={2}
                    value={card.year}
                    onChange={(e) => setCard({ ...card, year: e.target.value.replace(/\D/g, "").slice(0, 2) })}
                    placeholder="AA"
                    className="w-1/2 rounded-lg px-3 py-3 bg-charcoal border border-hline text-white placeholder:text-muted outline-none focus:border-orange"
                  />
                </div>
              </div>
              <div className="w-24">
                <label className="text-[11px] font-semibold text-muted">CVV</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  value={card.cvv}
                  onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, "") })}
                  placeholder="000"
                  className="w-full mt-1 rounded-lg px-3 py-3 bg-charcoal border border-hline text-white placeholder:text-muted outline-none focus:border-orange"
                />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted">NOME IMPRESSO NO CARTÃO</label>
              <input
                type="text"
                value={card.name}
                onChange={(e) => setCard({ ...card, name: e.target.value.toUpperCase() })}
                placeholder="COMO ESTÁ NO CARTÃO"
                className="w-full mt-1 rounded-lg px-4 py-3 bg-charcoal border border-hline text-white placeholder:text-muted outline-none focus:border-orange"
              />
            </div>
            {cardTouched && !cardValid && (
              <p className="text-[11px] text-[#ef4444]">Confira os dados do cartão — algum campo está incompleto.</p>
            )}
            <div className="flex items-start gap-2 text-[10px] text-muted">
              <ShieldCheck size={13} color="#F2600C" className="flex-shrink-0 mt-0.5" />
              Seus dados do cartão vão direto e criptografados pro Mercado Pago — a Galavot Adventure nunca vê nem
              guarda o número do seu cartão. Cobrança à vista (1x), sem parcelamento.
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-lg px-3 py-3 mt-4 bg-stone border border-[#ef4444]">
            <AlertCircle size={16} color="#ef4444" className="flex-shrink-0 mt-0.5" />
            <span className="text-[11px] text-cream leading-relaxed">{error}</span>
          </div>
        )}

        {method === "pix" && (
          <div className="flex items-start gap-2 rounded-lg px-3 py-3 mt-4 bg-stone border border-hline">
            <Smartphone size={16} color="#F2600C" className="flex-shrink-0 mt-0.5" />
            <span className="text-[11px] text-cream leading-relaxed">
              O QR Code e o código Pix aparecem aqui mesmo no app — pague com o aplicativo de qualquer banco.
            </span>
          </div>
        )}
        {method === "transferencia" && (
          <div className="flex items-start gap-2 rounded-lg px-3 py-3 mt-4 bg-stone border border-hline">
            <Landmark size={16} color="#F2600C" className="flex-shrink-0 mt-0.5" />
            <span className="text-[11px] text-cream leading-relaxed">
              Você vai ser redirecionado pro Mercado Pago pra concluir a transferência com segurança.
            </span>
          </div>
        )}
      </div>
      <div className="px-4 pb-6 mt-auto pt-4">
        <PrimaryButton onClick={handleConfirm} disabled={!method || loading}>
          {loading ? loadingLabel : isCard ? `PAGAR R$ ${valorAgora}` : method === "pix" ? "GERAR PIX" : "IR PARA O PAGAMENTO"}
        </PrimaryButton>
      </div>
    </div>
  );
}
