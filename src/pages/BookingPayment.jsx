import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CreditCard, Smartphone, AlertCircle, Landmark, Wallet } from "lucide-react";
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
    customer,
    setLastConfirmedBooking,
  } = useBooking();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const total = prices[tour.id] ?? tour.price; // preço é por quadriciclo, não por pessoa — pago à vista

  const handleConfirm = async () => {
    setError(null);
    setLoading(true);
    try {
      // Chama a função serverless (api/create-preference.js) que cria a
      // preferência de pagamento no Mercado Pago e devolve o link de checkout.
      const res = await fetch("/api/create-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tourId: tour.id,
          payerName: customer.name,
          payerPhone: customer.phone,
          paymentPlan,
        }),
      });

      if (!res.ok) throw new Error("Falha ao criar preferência de pagamento");
      const data = await res.json();

      // Salva a reserva no banco (pra aparecer no painel /admin). O servidor
      // reconfere o limite de quadriciclos nesse momento — se acabou de
      // lotar (ex: duas pessoas reservando ao mesmo tempo), avisamos o
      // cliente em vez de deixar ele achar que reservou.
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

      let bookingCode = null;
      try {
        const bookingData = await bookingRes.json();
        bookingCode = bookingData?.booking?.booking_code || null;
      } catch (parseErr) {
        // Se não vier o código por algum motivo, a reserva ainda foi feita —
        // só não teremos o código curto pra mostrar no comprovante.
      }
      // Outros erros (ex: banco fora do ar momentaneamente) não bloqueiam o
      // cliente — a reserva ainda chega pelo WhatsApp na tela de confirmação.

      setLastConfirmedBooking({
        tourId: tour.id,
        tourName: tour.name,
        time: selectedTime,
        participants,
        method,
        paymentPlan,
        total,
        sinal: total,
        restante: 0,
        valorAgora: total,
        customer,
        bookingCode,
      });

      // Em produção, redireciona para o checkout do Mercado Pago:
      // window.location.href = data.init_point;
      navigate(`/passeio/${id}/confirmacao`);
    } catch (e) {
      setError(
        "Ainda não foi possível conectar ao Mercado Pago. Configure a chave de acesso no arquivo .env (veja o README)."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-charcoal flex flex-col">
      <TopBar title="PAGAMENTO" showBack />
      <TrailProgress step={4} total={4} />
      <div className="px-4">
        <div className="rounded-xl p-4 bg-stone border border-hline mt-1">
          <div className="font-display text-white text-[15px]">RESUMO DO PEDIDO</div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-muted">{tour.name}</span>
            <span className="text-xs text-cream">{selectedTime} · {participants} pessoa(s)</span>
          </div>
          <div className="h-px my-3 bg-hline" />
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted flex items-center gap-1.5">
              <Wallet size={13} color="#B7AFA2" /> Total do passeio (pago agora)
            </span>
            <span className="font-display text-orange text-lg">R$ {total}</span>
          </div>
        </div>

        <div className="font-display text-muted text-sm tracking-wide mt-4">FORMA DE PAGAMENTO</div>
        <div className="flex flex-col gap-2 mt-2">
          {PAYMENT_METHODS.map(({ key, label, icon: Icon }) => {
            const active = method === key;
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
                  <div className={`text-[10px] ${active ? "text-ink" : "text-muted"}`}>
                    Pagamento à vista (R$ {total})
                  </div>
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
      </div>
      <div className="px-4 pb-6 mt-auto pt-4">
        <PrimaryButton onClick={handleConfirm} disabled={!method || loading}>
          {loading ? "PROCESSANDO..." : "CONFIRMAR RESERVA"}
        </PrimaryButton>
      </div>
    </div>
  );
}
