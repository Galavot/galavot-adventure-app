import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CheckCircle2, Clock, XCircle, MapPin, Phone, Navigation, RefreshCw } from "lucide-react";
import { TopBar, PrimaryButton } from "../components/UI.jsx";
import { CONTACT } from "../data.js";

const METHOD_LABELS = {
  pix: "Pix",
  credito: "Cartão de Crédito",
  debito: "Cartão de Débito",
  transferencia: "Transferência Bancária",
};

// Tela que o cliente vê ao voltar do checkout do Mercado Pago. Como esse
// retorno é uma navegação externa (o navegador sai do app e volta), a
// memória do React se perde — por isso essa tela busca a reserva de novo
// no servidor, pelo código, em vez de depender de algo guardado antes.
export default function PaymentReturn() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/create-booking?code=${encodeURIComponent(code)}`);
      if (!res.ok) {
        setNotFound(true);
        return;
      }
      const data = await res.json();
      setBooking(data.booking);
    } catch (err) {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  // Enquanto o pagamento ainda está "pendente_pagamento" (comum no Pix, que
  // demora alguns segundos pra confirmar), fica checando de novo sozinho.
  useEffect(() => {
    if (booking?.status !== "pendente_pagamento") return;
    const interval = setInterval(load, 4000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booking?.status]);

  if (loading && !booking) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-charcoal text-center px-6">
        <RefreshCw size={28} color="#F2600C" className="animate-spin" />
        <p className="text-cream text-sm mt-3">Verificando seu pagamento...</p>
      </div>
    );
  }

  if (notFound || !booking) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-charcoal text-center px-6">
        <XCircle size={40} color="#ef4444" />
        <p className="text-cream text-sm mt-3">Não encontramos essa reserva.</p>
        <p className="text-muted text-[11px] mt-1">
          Se você já pagou, chama a gente no WhatsApp com o código {code} que resolvemos na hora.
        </p>
        <div className="mt-5 w-full">
          <PrimaryButton onClick={() => navigate("/")}>VOLTAR AO INÍCIO</PrimaryButton>
        </div>
      </div>
    );
  }

  const {
    booking_code,
    tour_name,
    booking_date,
    booking_time,
    participants,
    payment_method,
    payment_plan,
    total,
    valor_pago_inicial,
    status,
  } = booking;

  const dateLabel = new Date(booking_date + "T12:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const restante = payment_plan === "sinal" ? total - valor_pago_inicial : 0;
  const pagamentoTexto =
    payment_plan === "vista"
      ? `Pagamento à vista: R$ ${total} (pago)`
      : `Sinal de R$ ${valor_pago_inicial} pago (50%), restante R$ ${restante} no embarque`;

  const whatsappMessage = encodeURIComponent(
    `Olá! Minha reserva ${booking_code} foi paga:\n\n` +
      `Passeio: ${tour_name}\n` +
      `Data: ${dateLabel}\n` +
      `Horário: ${booking_time}\n` +
      `Pessoas: ${participants}\n` +
      `Pagamento: ${METHOD_LABELS[payment_method] || payment_method} — ${pagamentoTexto}\n\n` +
      `Ponto de encontro: ${CONTACT.meetingPoint.address}\n${CONTACT.meetingPoint.mapsUrl}\n\n` +
      `Aguardo confirmação!`
  );

  if (status === "pagamento_recusado") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-charcoal text-center px-6">
        <XCircle size={44} color="#ef4444" />
        <div className="font-display text-white text-xl mt-3">PAGAMENTO NÃO APROVADO</div>
        <p className="text-muted text-[12px] mt-2 max-w-[280px]">
          Seu pagamento não foi aprovado pelo Mercado Pago. Você pode tentar de novo com outro método ou cartão.
        </p>
        <div className="mt-5 w-full">
          <PrimaryButton onClick={() => navigate("/passeios")}>TENTAR NOVAMENTE</PrimaryButton>
        </div>
      </div>
    );
  }

  if (status === "pendente_pagamento") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-charcoal text-center px-6">
        <Clock size={44} color="#F2600C" />
        <div className="font-display text-white text-xl mt-3">AGUARDANDO PAGAMENTO</div>
        <p className="text-muted text-[12px] mt-2 max-w-[280px]">
          Assim que o Mercado Pago confirmar (o Pix costuma ser na hora), essa tela atualiza sozinha.
        </p>
        <div className="text-orange text-[11px] font-mono mt-3">{booking_code}</div>
      </div>
    );
  }

  // status === "confirmado"
  return (
    <div className="flex-1 overflow-y-auto flex flex-col items-center bg-charcoal">
      <TopBar title="RESERVA CONFIRMADA" />
      <div className="flex flex-col items-center mt-6 px-6 text-center">
        <CheckCircle2 size={52} color="#F2600C" />
        <div className="font-display text-white text-2xl mt-3">TUDO PRONTO PRA AVENTURA!</div>
        <div className="text-xs text-muted mt-1">Pagamento confirmado pelo Mercado Pago.</div>
      </div>

      <div className="w-full px-4 mt-6">
        <div className="rounded-xl p-4 bg-stone" style={{ border: "1px dashed #F2600C" }}>
          <div className="font-display text-white text-[17px]">{tour_name}</div>
          <div className="text-[11px] text-muted mt-0.5">
            {dateLabel} · {booking_time} · {participants} pessoa(s)
          </div>
          <div className="text-[11px] text-orange font-semibold mt-1 font-mono">{booking_code}</div>
          <div className="text-[9px] text-muted mt-0.5 max-w-[220px]">
            Esse é o seu código de embarque — também chega pelo WhatsApp
          </div>
          <div className="h-px my-3 bg-hline" />
          <div className="flex items-center gap-2">
            <MapPin size={14} color="#F2600C" />
            <span className="text-[11px] text-cream">Ponto de encontro: {CONTACT.meetingPoint.address}</span>
          </div>
        </div>

        <a
          href={CONTACT.meetingPoint.mapsUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 rounded-lg py-3 mt-4 bg-orange"
        >
          <Navigation size={16} color="#1A1A1A" />
          <span className="font-display text-ink text-[15px]">COMO CHEGAR</span>
        </a>

        <a
          href={`https://wa.me/${CONTACT.whatsapp}?text=${whatsappMessage}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 rounded-lg py-3 mt-3 bg-moss"
        >
          <Phone size={16} color="#fff" />
          <span className="font-display text-white text-[15px]">ENVIAR RESERVA PRO WHATSAPP</span>
        </a>
        <p className="text-[10px] text-muted text-center mt-2 px-4">
          Toque no botão acima para confirmar sua reserva com a equipe pelo WhatsApp.
        </p>
      </div>

      <div className="px-4 pb-6 mt-auto w-full pt-6">
        <PrimaryButton
          onClick={() =>
            navigate(sessionStorage.getItem("galavot_partner_token") ? "/parceiro/painel" : "/")
          }
        >
          {sessionStorage.getItem("galavot_partner_token") ? "VOLTAR AO PAINEL" : "VOLTAR AO INÍCIO"}
        </PrimaryButton>
      </div>
    </div>
  );
}
