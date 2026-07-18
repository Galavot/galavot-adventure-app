import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CreditCard, Smartphone, AlertCircle } from "lucide-react";
import { TopBar, TrailProgress, PrimaryButton } from "../components/UI.jsx";
import { TOURS } from "../data.js";
import { useBooking } from "../context/BookingContext.jsx";

export default function BookingPayment() {
  const { id } = useParams();
  const navigate = useNavigate();
  const tour = TOURS.find((t) => t.id === id);
  const { dates, selectedDateIndex, participants, selectedTime, method, setMethod, customer, setLastConfirmedBooking } = useBooking();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const total = tour.price; // preço é por quadriciclo, não por pessoa
  const sinal = Math.round(total * 0.5);
  const restante = total - sinal;

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
          tourName: tour.name,
          amount: sinal,
          description: `Sinal (50%) - ${tour.name} - ${customer.name}`,
          payerName: customer.name,
          payerPhone: customer.phone,
        }),
      });

      if (!res.ok) throw new Error("Falha ao criar preferência de pagamento");
      const data = await res.json();

      // Salva a reserva no banco (pra aparecer no painel /admin).
      // Se essa chamada falhar, não bloqueia o cliente — a reserva ainda
      // chega pelo WhatsApp na tela de confirmação.
      try {
        await fetch("/api/create-booking", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tourId: tour.id,
            tourName: tour.name,
            date: dates[selectedDateIndex].iso,
            time: selectedTime,
            participants,
            customerName: customer.name,
            customerPhone: customer.phone,
            method,
            total,
          }),
        });
      } catch (dbErr) {
        // Silencioso de propósito — ver comentário acima.
      }

      setLastConfirmedBooking({
        tourId: tour.id,
        tourName: tour.name,
        time: selectedTime,
        participants,
        method,
        total,
        sinal,
        restante,
        customer,
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
            <span className="text-xs text-muted">Sinal agora (50%)</span>
            <span className="font-display text-orange text-lg">R$ {sinal}</span>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-muted">Restante no embarque (50%)</span>
            <span className="text-xs text-cream">R$ {restante}</span>
          </div>
        </div>

        <div className="font-display text-muted text-sm tracking-wide mt-4">FORMA DE PAGAMENTO</div>
        <div className="flex flex-col gap-2 mt-2">
          {[
            { key: "pix", label: "Pix", sub: `Sinal de 50% agora (R$ ${sinal}) — restante no embarque`, icon: Smartphone },
            { key: "card", label: "Cartão de crédito", sub: `Sinal de 50% agora (R$ ${sinal}) — restante no embarque`, icon: CreditCard },
          ].map(({ key, label, sub, icon: Icon }) => {
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
                  <div className={`text-[10px] ${active ? "text-ink" : "text-muted"}`}>{sub}</div>
                </div>
              </button>
            );
          })}
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg px-3 py-3 mt-4 bg-stone border border-orange">
            <AlertCircle size={16} color="#F2600C" className="flex-shrink-0 mt-0.5" />
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
