import React, { useEffect, useState } from "react";
import { Send, CheckCircle2, XCircle, Sun, Moon } from "lucide-react";
import { TOURS } from "../data.js";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function buildMessage(tour, dateLabel, bookingsForTurno) {
  const lines = [`📋 LISTA — ${tour.name} (${tour.time})`, dateLabel, ""];

  if (bookingsForTurno.length === 0) {
    lines.push("Nenhuma reserva pra esse turno hoje.");
    return lines.join("\n");
  }

  bookingsForTurno.forEach((b, i) => {
    const termoOk = !!b.aceite_em;
    lines.push(`${i + 1}. ${b.booking_code || "s/código"} · ${b.customer_name}`);
    lines.push(
      `   ${termoOk ? "✅" : "⚠️"} Termo ${termoOk ? "aceito" : "NÃO aceito"} · ${
        b.status === "cancelado" ? "❌ Cancelada" : "Status: " + b.status
      }`
    );
  });

  lines.push("");
  lines.push(`Total: ${bookingsForTurno.length} reserva(s)`);
  return lines.join("\n");
}

export default function AdminDailyList({ bookings }) {
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = sessionStorage.getItem("galavot_admin_token");
    fetch("/api/admin-guides", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => setGuides(data.guides || []))
      .catch(() => setGuides([]))
      .finally(() => setLoading(false));
  }, []);

  const today = todayIso();
  const dateLabel = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit" });

  return (
    <div className="px-4 py-4 flex flex-col gap-5">
      <p className="text-[11px] text-muted -mt-1">
        Lista sempre atualizada com as reservas de hoje ({dateLabel}). Sem envio automático ainda — toque no botão
        verde pra abrir o WhatsApp já com a mensagem pronta pro guia.
      </p>

      {TOURS.map((tour) => {
        const bookingsForTurno = bookings.filter((b) => b.tour_id === tour.id && b.booking_date === today);
        const message = buildMessage(tour, dateLabel, bookingsForTurno);
        const guidesForTurno = guides.filter(
          (g) => g.ativo && (tour.id === "matinal" ? g.recebe_matinal : g.recebe_vespertino)
        );

        return (
          <div key={tour.id} className="rounded-xl p-4 bg-stone border border-hline">
            <div className="flex items-center gap-2 mb-2">
              {tour.id === "matinal" ? (
                <Sun size={15} color="#F2600C" />
              ) : (
                <Moon size={15} color="#F2600C" />
              )}
              <span className="font-display text-white text-[16px]">{tour.name}</span>
              <span className="text-[11px] text-muted ml-auto">{bookingsForTurno.length} reserva(s)</span>
            </div>

            <div className="flex flex-col gap-1.5">
              {bookingsForTurno.length === 0 && (
                <p className="text-[12px] text-muted">Nenhuma reserva pra esse turno hoje.</p>
              )}
              {bookingsForTurno.map((b) => {
                const termoOk = !!b.aceite_em;
                return (
                  <div key={b.id} className="flex items-center justify-between text-[12px]">
                    <span className="text-cream">
                      {b.booking_code || "—"} · {b.customer_name}
                    </span>
                    {termoOk ? (
                      <span className="flex items-center gap-1 text-[10px]" style={{ color: "#22c55e" }}>
                        <CheckCircle2 size={11} /> termo ok
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px]" style={{ color: "#ef4444" }}>
                        <XCircle size={11} /> sem termo
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {!loading && guidesForTurno.length === 0 && (
              <p className="text-[11px] text-orange mt-3">
                Nenhum guia ativo cadastrado pra esse turno — cadastre na aba GUIAS.
              </p>
            )}

            <div className="flex flex-col gap-2 mt-3">
              {guidesForTurno.map((g) => (
                <a
                  key={g.id}
                  href={`https://wa.me/${g.whatsapp}?text=${encodeURIComponent(message)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 py-2 rounded-lg text-[12px] font-bold"
                  style={{ background: "#25D366", color: "#fff" }}
                >
                  <Send size={13} /> Enviar pro {g.nome} (WhatsApp)
                </a>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
