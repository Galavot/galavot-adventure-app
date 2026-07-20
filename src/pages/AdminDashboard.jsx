import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, RefreshCw, Clock, Users, Phone } from "lucide-react";
import { Pill } from "../components/UI.jsx";
import AdminPartners from "./AdminPartners.jsx";

const STATUS_OPTIONS = ["confirmado", "concluido", "cancelado"];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("reservas"); // 'reservas' | 'parceiros'
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("todos");

  const getToken = () => sessionStorage.getItem("galavot_admin_token");

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    const token = getToken();
    if (!token) {
      navigate("/admin");
      return;
    }
    try {
      const res = await fetch("/api/admin-bookings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.status === 401) {
        sessionStorage.removeItem("galavot_admin_token");
        navigate("/admin");
        return;
      }
      if (!res.ok) throw new Error(data.error || "Erro ao carregar reservas");
      setBookings(data.bookings || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const updateStatus = async (id, status) => {
    const token = getToken();
    try {
      const res = await fetch("/api/admin-bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error("Erro ao atualizar");
      setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("galavot_admin_token");
    navigate("/admin");
  };

  const filtered = filter === "todos" ? bookings : bookings.filter((b) => b.status === filter);

  return (
    <div className="flex-1 overflow-y-auto bg-charcoal">
      <div className="flex items-center justify-between px-4 pt-5 pb-3 bg-ink sticky top-0 z-10">
        <div className="font-display text-white text-xl">{tab === "reservas" ? "RESERVAS" : "PARCEIROS"}</div>
        <div className="flex items-center gap-3">
          <button onClick={loadBookings} aria-label="Atualizar">
            <RefreshCw size={18} color="#B7AFA2" />
          </button>
          <button onClick={handleLogout} aria-label="Sair">
            <LogOut size={18} color="#B7AFA2" />
          </button>
        </div>
      </div>

      <div className="flex gap-2 px-4 pt-3">
        {[
          { key: "reservas", label: "RESERVAS" },
          { key: "parceiros", label: "PARCEIROS" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2 rounded-lg text-[12px] font-semibold ${
              tab === t.key ? "bg-orange text-ink" : "bg-stone text-muted border border-hline"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "reservas" && (
        <>
          <div className="flex gap-2 px-4 pt-3 overflow-x-auto">
            {["todos", "confirmado", "concluido", "cancelado"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-semibold flex-shrink-0 ${
                  filter === f ? "bg-orange text-ink" : "bg-stone text-muted border border-hline"
                }`}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="px-4 py-4 flex flex-col gap-3">
            {loading && <p className="text-muted text-sm text-center mt-8">Carregando...</p>}
            {error && <p className="text-orange text-sm text-center mt-8">{error}</p>}
            {!loading && filtered.length === 0 && (
              <p className="text-muted text-sm text-center mt-8">Nenhuma reserva encontrada.</p>
            )}
            {filtered.map((b) => (
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
                      {b.booking_date} · {b.booking_time}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users size={12} color="#B7AFA2" />
                    <span className="text-[11px] text-muted">{b.participants} pessoa(s)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Phone size={12} color="#B7AFA2" />
                    <span className="text-[11px] text-muted">{b.customer_phone}</span>
                  </div>
                </div>
                {b.partner_id && (
                  <div className="text-[11px] text-orange mt-1.5">
                    Reserva via parceiro · comissão R$ {Number(b.comissao_valor || 0).toFixed(2)}{" "}
                    {b.comissao_paga ? "(paga)" : "(pendente)"}
                  </div>
                )}
                <div className="flex gap-2 mt-3">
                  {STATUS_OPTIONS.filter((s) => s !== b.status).map((s) => (
                    <button
                      key={s}
                      onClick={() => updateStatus(b.id, s)}
                      className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-ink text-cream border border-hline"
                    >
                      Marcar {s}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === "parceiros" && <AdminPartners bookings={bookings} />}
    </div>
  );
}
