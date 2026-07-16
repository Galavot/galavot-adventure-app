import React from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, MapPin, Phone } from "lucide-react";
import { TopBar, PrimaryButton } from "../components/UI.jsx";
import { CONTACT, DATES } from "../data.js";
import { useBooking } from "../context/BookingContext.jsx";

export default function BookingConfirmation() {
  const navigate = useNavigate();
  const { lastConfirmedBooking, selectedDateIndex, resetBookingFlow } = useBooking();

  if (!lastConfirmedBooking) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-charcoal text-center px-6">
        <p className="text-cream text-sm">Nenhuma reserva recente encontrada.</p>
        <div className="mt-4 w-full">
          <PrimaryButton onClick={() => navigate("/passeios")}>VER PASSEIOS</PrimaryButton>
        </div>
      </div>
    );
  }

  const { tourName, time, participants, customer, total, method } = lastConfirmedBooking;
  const date = DATES[selectedDateIndex];

  const whatsappMessage = encodeURIComponent(
    `Olá! Acabei de reservar pelo site:\n\n` +
      `Passeio: ${tourName}\n` +
      `Data: ${date.sub}\n` +
      `Horário: ${time}\n` +
      `Pessoas: ${participants}\n` +
      `Nome: ${customer?.name || "-"}\n` +
      `WhatsApp: ${customer?.phone || "-"}\n` +
      `Pagamento: ${method === "pix" ? "Pix (sinal)" : "Cartão (integral)"} — R$ ${total}\n\n` +
      `Aguardo confirmação do ponto de encontro!`
  );

  const handleClose = () => {
    resetBookingFlow();
    navigate("/");
  };

  return (
    <div className="flex-1 overflow-y-auto flex flex-col items-center bg-charcoal">
      <TopBar title="RESERVA CONFIRMADA" />
      <div className="flex flex-col items-center mt-6 px-6 text-center">
        <CheckCircle2 size={52} color="#F2600C" />
        <div className="font-display text-white text-2xl mt-3">TUDO PRONTO PRA AVENTURA!</div>
        <div className="text-xs text-muted mt-1">Seu voucher foi enviado por WhatsApp e e-mail.</div>
      </div>

      <div className="w-full px-4 mt-6">
        <div className="rounded-xl p-4 bg-stone" style={{ border: "1px dashed #F2600C" }}>
          <div className="flex justify-between items-start">
            <div>
              <div className="font-display text-white text-[17px]">{tourName}</div>
              <div className="text-[11px] text-muted mt-0.5">
                {date.sub} · {time} · {participants} pessoa(s)
              </div>
            </div>
            <div className="w-14 h-14 rounded flex items-center justify-center flex-shrink-0 bg-ink">
              <span className="text-[8px] text-muted">QR CODE</span>
            </div>
          </div>
          <div className="h-px my-3 bg-hline" />
          <div className="flex items-center gap-2">
            <MapPin size={14} color="#F2600C" />
            <span className="text-[11px] text-cream">Ponto de encontro: enviado no WhatsApp</span>
          </div>
        </div>

        <a
          href={`https://wa.me/${CONTACT.whatsapp}?text=${whatsappMessage}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 rounded-lg py-3 mt-4 bg-moss"
        >
          <Phone size={16} color="#fff" />
          <span className="font-display text-white text-[15px]">ENVIAR RESERVA PRO WHATSAPP</span>
        </a>
        <p className="text-[10px] text-muted text-center mt-2 px-4">
          Toque no botão acima para confirmar sua reserva com a equipe pelo WhatsApp.
        </p>
      </div>

      <div className="px-4 pb-6 mt-auto w-full pt-6">
        <PrimaryButton onClick={handleClose}>VOLTAR AO INÍCIO</PrimaryButton>
      </div>
    </div>
  );
}
