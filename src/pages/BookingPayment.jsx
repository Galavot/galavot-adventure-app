import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CreditCard, Smartphone, AlertCircle, Landmark, Wallet, Check, MessageCircle } from "lucide-react";
import { TopBar, TrailProgress, PrimaryButton } from "../components/UI.jsx";
import { TOURS } from "../data.js";
import { useBooking } from "../context/BookingContext.jsx";
import { usePrices } from "../context/PricesContext.jsx";

const PAYMENT_METHODS = [
  { key: "pix", label: "Pix", icon: Smartphone },
  { key: "credito", label: "Cartão de Crédito", icon: CreditCard },
  { key: "debito", label: "Cartão de Débito", icon: CreditCard },
  { key: "transferencia", label: "Transferência Bancária", icon: Landmark },
];

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
  const [error, setError] = useState(null);

  const total = prices[tour.id] ?? tour.price; // preço é por quadriciclo, não por pessoa
  const sinal = Math.round(total * 0.5);
  const restante = total - sinal;
  const valorAgora = paymentPlan === "vista" ? total : sinal;

  const handleConfirm = async () => {
    setError(null);
    setLoading(true);
    try {
      // 1. Salva a reserva no banco primeiro (nasce como "pendente_pagamento").
      // O servidor reconfere o limite de quadriciclos nesse momento — se
      // acabou de lotar, avisamos o cliente em vez de deixar ele achar que
      // reservou.
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
        setError(data.error || "Esse horário acabou de lotar. Volte e escolha outra data.");
        setLoading(false);
        return;
      }
      if (!bookingRes.ok) throw new Error("Falha ao salvar a reserva");
      const { booking } = await bookingRes.json();

      // 2. Cria a preferência de pagamento no Mercado Pago, vinculada a
      // essa reserva (external_reference = id da reserva).
      const prefRes = await fetch("/api/create-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tourId: tour.id,
          payerName: customer.name,
          payerEmail: customer.email,
          paymentPlan,
          bookingId: booking.id,
          bookingCode: booking.booking_code,
        }),
      });

      if (!prefRes.ok) {
        const data = await prefRes.json().catch(() => ({}));
        throw new Error(data.error || "Falha ao criar preferência de pagamento");
      }
      const { init_point } = await prefRes.json();

      if (!init_point) throw new Error("Não recebemos o link de pagamento do Mercado Pago");

      // 3. Manda o cliente de verdade pro checkout do Mercado Pago. A
      // reserva só vira "confirmado" quando o webhook avisar que o
      // pagamento caiu (api/mercadopago-webhook.js).
      window.location.href = init_point;
    } catch (e) {
      setError(
        e.message ||
          "Ainda não foi possível conectar ao Mercado Pago. Configure a chave de acesso no arquivo .env (veja o README)."
      );
      setLoading(false);
    }
  };

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

        {error && (
          <div className="flex items-start gap-2 rounded-lg px-3 py-3 mt-4 bg-stone border border-[#ef4444]">
            <AlertCircle size={16} color="#ef4444" className="flex-shrink-0 mt-0.5" />
            <span className="text-[11px] text-cream leading-relaxed">{error}</span>
          </div>
        )}

        <div className="flex items-start gap-2 rounded-lg px-3 py-3 mt-4 bg-stone border border-hline">
          <MessageCircle size={16} color="#F2600C" className="flex-shrink-0 mt-0.5" />
          <span className="text-[11px] text-cream leading-relaxed">
            Você vai ser redirecionado pro Mercado Pago pra pagar com segurança. Depois de pagar, o código da sua
            reserva aparece na tela — se preencheu o e-mail, também chega por lá. É esse código que autoriza seu
            embarque no dia do passeio.
          </span>
        </div>
      </div>
      <div className="px-4 pb-6 mt-auto pt-4">
        <PrimaryButton onClick={handleConfirm} disabled={!method || loading}>
          {loading ? "REDIRECIONANDO..." : "IR PARA O PAGAMENTO"}
        </PrimaryButton>
      </div>
    </div>
  );
}
