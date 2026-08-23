import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, Users, Search, RefreshCw, Phone } from "lucide-react";
import { TopBar, Pill, PrimaryButton } from "../components/UI.jsx";

const STORAGE_KEY = "galavot_customer_phone";

const STATUS_LABELS = {
  confirmado: "Confirmado",
  pendente_pagamento: "Aguardando pagamento",
  pagamento_recusado: "Pagamento recusado",
  cancelado: "Cancelado",
};

const STATUS_COLORS = {
  confirmado: "bg-green-600 text-white",
  pendente_pagamento: "bg-amber-500 text-ink",
  pagamento_recusado: "bg-red-600 text-white",
  cancelado: "bg-stoneLight text-cream",
};

function StatusPill({ status }) {
  const label = STATUS_LABELS[status] || status;
  const colorClass = STATUS_COLORS[status] || "bg-stoneLight text-cream";
  return <span className={`text-[11px] font-semibold px-2 py-1 rounded-full ${colorClass}`}>{label}</span>;
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  try {
    return new Date(dateStr + "T12:00:00").toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function Bookings() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [savedPhone, setSavedPhone] = useState("");
  const [bookings, setBookings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const search = async (phoneToUse) => {
    const digitsOnly = phoneToUse.replace(/\D/g, "");
    if (digitsOnly.length < 8) {
      setError("Digite um telefone válido (com DDD).");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/create-booking?phone=${encodeURIComponent(phoneToUse)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Não conseguimos buscar suas reservas agora.");
        setBookings([]);
        return;
      }
      setBookings(data.bookings || []);
      localStorage.setItem(STORAGE_KEY, phoneToUse);
      setSavedPhone(phoneToUse);
    } catch {
      setError("Sem conexão. Verifique sua internet e tente de novo.");
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  // Se o cliente já buscou antes nesse aparelho, mostra direto sem pedir de novo.
  useEffect(() => {
    const remembered = localStorage.getItem(STORAGE_KEY);
    if (remembered) {
      setPhone(remembered);
      setSavedPhone(remembered);
      search(remembered);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const trocarTelefone = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSavedPhone("");
    setBookings(null);
    setPhone("");
    setError("");
  };

  return (
    <div className="flex-1 overflow-y-auto bg-charcoal">
      <TopBar title="MINHAS RESERVAS" />

      {!savedPhone && (
        <div className="px-4 py-6 flex flex-col gap-3">
          <p className="text-cream text-sm">
            Digite o telefone que você usou na reserva pra ver seus passeios.
          </p>
          <div className="flex items-center gap-2 bg-stone border border-hline rounded-lg px-3 py-3">
            <Phone size={16} color="#B7AFA2" />
            <input
              type="tel"
              inputMode="tel"
              placeholder="(27) 99999-9999"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && search(phone)}
              className="flex-1 bg-transparent text-cream text-sm outline-none placeholder:text-muted"
            />
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <PrimaryButton onClick={() => search(phone)} disabled={loading}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <RefreshCw size={16} className="animate-spin" /> Buscando...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Search size={16} /> Buscar minhas reservas
              </span>
            )}
          </PrimaryButton>
        </div>
      )}

      {savedPhone && (
        <div className="px-4 pt-4 flex items-center justify-between">
          <span className="text-[11px] text-muted">Buscando por: {savedPhone}</span>
          <button onClick={trocarTelefone} className="text-[11px] text-orange font-semibold">
            Trocar telefone
          </button>
        </div>
      )}

      <div className="px-4 py-4 flex flex-col gap-3">
        {loading && bookings === null && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <RefreshCw size={18} color="#F2600C" className="animate-spin" />
            <span className="text-muted text-sm">Buscando suas reservas...</span>
          </div>
        )}

        {bookings !== null && bookings.length === 0 && !loading && (
          <div className="text-center mt-8">
            <p className="text-muted text-sm">Nenhuma reserva encontrada com esse telefone.</p>
            <p className="text-muted text-xs mt-1">
              Chama a gente no WhatsApp se você já reservou e algo parece errado.
            </p>
          </div>
        )}

        {bookings?.map((b) => (
          <div key={b.id} className="rounded-xl p-4 border bg-stone border-hline">
            <div className="flex justify-between items-start gap-2">
              <div>
                <div className="font-display text-white text-base">{b.tour_name}</div>
                <div className="text-[11px] text-muted mt-0.5">Código: {b.booking_code}</div>
              </div>
              <StatusPill status={b.status} />
            </div>
            <div className="flex items-center gap-3 mt-2">
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
            <button
              onClick={() => navigate(`/confirmacao/${b.booking_code}`)}
              className="text-[11px] text-orange font-semibold mt-3"
            >
              Ver detalhes
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
