import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, RefreshCw, Clock, Users, PlusCircle, Wallet, MessageCircle } from "lucide-react";
import { Pill, PrimaryButton, Logo } from "../components/UI.jsx";
import { CONTACT } from "../data.js";
import { isValidPhoneNumber } from "../utils/validation.js";

// A data vem do banco em formato ISO (2026-08-28) — mais legível pra
// gente formatar como dd/mm/aaaa na tela.
function formatDate(iso) {
  if (!iso) return "";
  const [year, month, day] = iso.split("-");
  if (!year || !month || !day) return iso;
  return `${day}/${month}/${year}`;
}

function buildWhatsAppLink(phoneDigits, booking) {
  const message =
    `Olá! Aqui está o código da sua reserva na Galavot Adventure:\n\n` +
    `${booking.tour_name}\n` +
    `${formatDate(booking.booking_date)} · ${booking.booking_time}\n` +
    `Código: ${booking.booking_code}\n\n` +
    `Ponto de encontro: ${CONTACT.meetingPoint.address}\n${CONTACT.meetingPoint.mapsUrl}`;
  return `https://wa.me/55${phoneDigits}?text=${encodeURIComponent(message)}`;
}

export default function PartnerDashboard() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [comissaoPendente, setComissaoPendente] = useState(0);
  const [comissaoPaga, setComissaoPaga] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Guarda, por reserva, se o campo de "enviar pro zap" está aberto e o
  // número digitado — não precisa persistir no banco, é só pra montar o
  // link do WhatsApp na hora.
  const [sendState, setSendState] = useState({});

  const partnerName = sessionStorage.getItem("galavot_partner_name") || "Parceiro";

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const token = sessionStorage.getItem("galavot_partner_token");
    if (!token) {
      navigate("/parceiro");
      return;
    }
    try {
      const res = await fetch("/api/partner-bookings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.status === 401) {
        sessionStorage.removeItem("galavot_partner_token");
        navigate("/parceiro");
        return;
      }
      if (!res.ok) throw new Error(data.error || "Erro ao carregar reservas");
      setBookings(data.bookings || []);
      setComissaoPendente(data.comissaoPendente || 0);
      setComissaoPaga(data.comissaoPaga || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLogout = () => {
    sessionStorage.removeItem("galavot_partner_token");
    sessionStorage.removeItem("galavot_partner_id");
    sessionStorage.removeItem("galavot_partner_name");
    sessionStorage.removeItem("galavot_partner_whatsapp");
    navigate("/parceiro");
  };

  const toggleSend = (bookingId, defaultPhone) => {
    setSendState((prev) => ({
      ...prev,
      [bookingId]: prev[bookingId]
        ? { ...prev[bookingId], open: !prev[bookingId].open }
        : { open: true, phone: defaultPhone || "" },
    }));
  };

  const setSendPhone = (bookingId, phone) => {
    setSendState((prev) => ({ ...prev, [bookingId]: { ...prev[bookingId], phone } }));
  };

  return (
    <div className="flex-1 overflow-y-auto bg-charcoal">
      <div className="flex items-center justify-between px-4 pt-5 pb-3 bg-ink sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Logo size={32} />
          <div>
            <div className="font-display text-white text-base leading-tight">{partnerName}</div>
            <div className="text-[10px] text-muted">Parceiro de vendas</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={loadData} aria-label="Atualizar">
            <RefreshCw size={18} color="#B7AFA2" />
          </button>
          <button onClick={handleLogout} aria-label="Sair">
            <LogOut size={18} color="#B7AFA2" />
          </button>
        </div>
      </div>

      <div className="px-4 pt-4">
        <div className="rounded-xl p-4 bg-stone border border-hline flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-ink flex-shrink-0">
            <Wallet size={18} color="#F2600C" />
          </div>
          <div className="flex-1">
            <div className="text-[11px] text-muted">Comissão pendente</div>
            <div className="font-display text-orange text-xl">R$ {comissaoPendente.toFixed(2)}</div>
          </div>
          <div className="text-right">
            <div className="text-[11px] text-muted">Já recebido</div>
            <div className="text-cream text-sm font-semibold">R$ {comissaoPaga.toFixed(2)}</div>
          </div>
        </div>

        <div className="mt-4">
          <PrimaryButton onClick={() => navigate("/passeios")}>
            <span className="flex items-center justify-center gap-2">
              <PlusCircle size={16} />
              NOVA RESERVA
            </span>
          </PrimaryButton>
        </div>
      </div>

      <div className="px-4 py-4 flex flex-col gap-3">
        <div className="font-display text-muted text-sm tracking-wide">MINHAS RESERVAS</div>
        {loading && <p className="text-muted text-sm text-center mt-4">Carregando...</p>}
        {error && <p className="text-[#ef4444] text-sm text-center mt-4">{error}</p>}
        {!loading && bookings.length === 0 && (
          <p className="text-muted text-sm text-center mt-4">Você ainda não fez nenhuma reserva.</p>
        )}
        {bookings.map((b) => {
          const state = sendState[b.id];
          const isOpen = state?.open;
          const phoneValue = state?.phone ?? "";
          const phoneDigits = phoneValue.replace(/\D/g, "");
          const canSend = isValidPhoneNumber(phoneValue);
          return (
            <div key={b.id} className="rounded-xl p-4 bg-stone border border-hline">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-display text-white text-base">{b.tour_name}</div>
                  <div className="text-[11px] text-muted mt-0.5">{b.customer_name}</div>
                </div>
                <Pill>{b.status}</Pill>
              </div>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <div className="flex items-center gap-1">
                  <Clock size={12} color="#B7AFA2" />
                  <span className="text-[11px] text-muted">
                    {formatDate(b.booking_date)} · {b.booking_time}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Users size={12} color="#B7AFA2" />
                  <span className="text-[11px] text-muted">{b.participants} pessoa(s)</span>
                </div>
              </div>
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-hline">
                <span className="text-[11px] text-muted">Sua comissão</span>
                <span className="text-[13px] font-semibold text-orange">
                  R$ {Number(b.comissao_valor || 0).toFixed(2)} {b.comissao_paga ? "(pago)" : "(pendente)"}
                </span>
              </div>

              {(b.status === "confirmado" || b.status === "concluido") && (
                <div className="mt-2 pt-2 border-t border-hline">
                  {!isOpen ? (
                    <button
                      onClick={() => toggleSend(b.id, b.customer_phone)}
                      className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 bg-ink border border-hline"
                    >
                      <MessageCircle size={14} color="#6E7A4F" />
                      <span className="text-[12px] font-semibold text-cream">Enviar código pro WhatsApp</span>
                    </button>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <input
                        type="tel"
                        value={phoneValue}
                        onChange={(e) => setSendPhone(b.id, e.target.value)}
                        placeholder="WhatsApp do cliente (27) 9 9999-9999"
                        className="w-full rounded-lg px-3 py-2 bg-ink border border-hline text-white text-[12px] placeholder:text-muted outline-none focus:border-orange"
                      />
                      <a
                        href={canSend ? buildWhatsAppLink(phoneDigits, b) : undefined}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => !canSend && e.preventDefault()}
                        className={`w-full flex items-center justify-center gap-2 rounded-lg py-2.5 ${
                          canSend ? "bg-moss" : "bg-ink opacity-50"
                        }`}
                      >
                        <MessageCircle size={14} color="#fff" />
                        <span className="text-[12px] font-semibold text-white">Abrir WhatsApp</span>
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
