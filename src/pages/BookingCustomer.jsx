import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { TopBar, TrailProgress, PrimaryButton } from "../components/UI.jsx";
import { useBooking } from "../context/BookingContext.jsx";

export default function BookingCustomer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { customer, setCustomer } = useBooking();
  const [touched, setTouched] = useState(false);

  const nameValid = customer.name.trim().length >= 3;
  const phoneValid = customer.phone.replace(/\D/g, "").length >= 10;
  const canContinue = nameValid && phoneValid && customer.accepted;

  const handleContinue = () => {
    setTouched(true);
    if (canContinue) navigate(`/passeio/${id}/pagamento`);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-charcoal flex flex-col">
      <TopBar title="SEUS DADOS" showBack />
      <TrailProgress step={3} total={4} />
      <div className="px-4 flex flex-col gap-4">
        <div>
          <label className="text-[11px] font-semibold text-muted">NOME COMPLETO</label>
          <input
            type="text"
            value={customer.name}
            onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
            placeholder="Como está no documento"
            className="w-full mt-1 rounded-lg px-4 py-3 bg-stone border border-hline text-white placeholder:text-muted outline-none focus:border-orange"
          />
          {touched && !nameValid && <p className="text-[11px] text-orange mt-1">Informe seu nome completo.</p>}
        </div>

        <div>
          <label className="text-[11px] font-semibold text-muted">WHATSAPP</label>
          <input
            type="tel"
            value={customer.phone}
            onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
            placeholder="(27) 9 9999-9999"
            className="w-full mt-1 rounded-lg px-4 py-3 bg-stone border border-hline text-white placeholder:text-muted outline-none focus:border-orange"
          />
          {touched && !phoneValid && <p className="text-[11px] text-orange mt-1">Informe um WhatsApp válido.</p>}
        </div>

        <label className="flex items-start gap-3 rounded-lg px-4 py-3 bg-stone border border-hline mt-2">
          <input
            type="checkbox"
            checked={customer.accepted}
            onChange={(e) => setCustomer({ ...customer, accepted: e.target.checked })}
            className="mt-0.5 accent-orange"
          />
          <span className="text-[12px] text-cream leading-relaxed">
            Declaro estar ciente dos riscos da atividade e concordo com o termo de responsabilidade da Galavot
            Adventure, que será assinado no check-in presencial.
          </span>
        </label>
        {touched && !customer.accepted && (
          <p className="text-[11px] text-orange -mt-2">É necessário aceitar o termo para continuar.</p>
        )}
      </div>
      <div className="px-4 pb-6 mt-auto pt-4">
        <PrimaryButton onClick={handleContinue}>CONTINUAR PARA PAGAMENTO</PrimaryButton>
      </div>
    </div>
  );
}
