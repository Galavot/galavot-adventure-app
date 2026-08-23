import React, { useEffect, useState } from "react";
import { Send, CheckCircle2, XCircle, Sun, Moon, ChevronLeft, ChevronRight } from "lucide-react";
import { TOURS, getUpcomingDates } from "../data.js";

function paymentLine(b) {
  const total = Number(b.total) || 0;
  const pago = Number(b.valor_pago_inicial) || 0;
  const restante = Math.max(0, Math.round((total - pago) * 100) / 100);

  if (b.payment_plan === "sinal" && restante > 0) {
    return `💰 Cobrar na hora: R$ ${restante.toFixed(2)} (pagou sinal de R$ ${pago.toFixed(2)})`;
  }
  return `💰 Pago 100% (R$ ${total.toFixed(2)}) — nada a cobrar`;
}

function buildMessage(tour, dateLabel, bookingsForTurno) {
  const lines = [`📋 LISTA — ${tour.name} (${tour.time})`, dateLabel, ""];

  if (bookingsForTurno.length === 0) {
    lines.push("Nenhuma reserva pra esse turno nesse dia.");
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
    lines.push(`   ${paymentLine(b)}`);
  });

  lines.push("");
  lines.push(`Total: ${bookingsForTurno.length} reserva(s)`);
  return lines.join("\n");
}

export default function AdminDailyList({ bookings }) {
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dates] = useState(() => getUpcomingDates(30));
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const token = sessionStorage.getItem("galavot_admin_token");
    fetch("/api/admin-guides", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => setGuides(data.guides || []))
      .catch(() => setGuides([]))
      .finally(() => setLoading(false));
  }, []);

  // Quantas reservas (não canceladas) existem em cada um dos próximos 30
  // dias — alimenta a faixa de agenda no topo, pra dar uma visão geral do
  // que vem por aí, não só do dia de hoje.
  const countByIso = {};
  bookings.forEach((b) => {
    if (b.status !== "confirmado") return;
    countByIso[b.booking_date] = (countByIso[b.booking_date] || 0) + 1;
  });

  const selected = dates[selectedIndex];
  const selectedDate = new Date(selected.iso + "T12:00:00");
  const dateLabel = selectedDate.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit" });
  const isToday = selectedIndex === 0;

  return (
    <div className="flex flex-col">
      <div className="px-4 pt-4">
        <p className="text-[11px] font-semibold text-muted mb-2">AGENDA — PRÓXIMOS 30 DIAS</p>
        <div className="flex gap-1.5 overflow-x-auto pb-2">
          {dates.map((d, i) => {
            const count = countByIso[d.iso] || 0;
            const active = i === selectedIndex;
            return (
              <button
                key={d.iso}
                onClick={() => setSelectedIndex(i)}
                className={`relative flex-shrink-0 flex flex-col items-center rounded-lg px-2.5 py-2 border ${
                  active ? "bg-orange border-orange" : "bg-stone border-hline"
                }`}
                style={{ minWidth: 46 }}
              >
                <span className={`text-[9px] font-bold ${active ? "text-ink" : "text-muted"}`}>{d.label}</span>
                <span className={`font-display text-[14px] ${active ? "text-ink" : "text-white"}`}>{d.sub}</span>
                {count > 0 && (
                  <span
                    className="absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] px-1 rounded-full flex items-center justify-center text-[9px] font-bold border-2 border-charcoal"
                    style={{ background: active ? "#151311" : "#F2600C", color: active ? "#F2600C" : "#151311" }}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 flex items-center justify-between mt-1 mb-3">
        <button
          onClick={() => setSelectedIndex((i) => Math.max(0, i - 1))}
          disabled={selectedIndex === 0}
          className="w-8 h-8 rounded-full flex items-center justify-center bg-stone border border-hline disabled:opacity-30"
        >
          <ChevronLeft size={16} color="#F5F0E6" />
        </button>
        <span className="text-[13px] font-semibold text-cream capitalize">
          {isToday ? `Hoje · ${dateLabel}` : dateLabel}
        </span>
        <button
          onClick={() => setSelectedIndex((i) => Math.min(dates.length - 1, i + 1))}
          disabled={selectedIndex === dates.length - 1}
          className="w-8 h-8 rounded-full flex items-center justify-center bg-stone border border-hline disabled:opacity-30"
        >
          <ChevronRight size={16} color="#F5F0E6" />
        </button>
      </div>

      <div className="px-4 pb-4 flex flex-col gap-5">
        <p className="text-[11px] text-muted -mt-2">
          {isToday
            ? "Sem envio automático ainda — toque no botão verde pra abrir o WhatsApp já com a mensagem pronta pro guia."
            : "Pré-visualização de um dia futuro. O botão de enviar funciona aqui também, se quiser adiantar o aviso pro guia."}
        </p>

        {TOURS.map((tour) => {
          const bookingsForTurno = bookings.filter(
            (b) => b.tour_id === tour.id && b.booking_date === selected.iso && b.status === "confirmado"
          );
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
                  <p className="text-[12px] text-muted">Nenhuma reserva pra esse turno nesse dia.</p>
                )}
                {bookingsForTurno.map((b) => {
                  const termoOk = !!b.aceite_em;
                  const total = Number(b.total) || 0;
                  const pago = Number(b.valor_pago_inicial) || 0;
                  const restante = Math.max(0, Math.round((total - pago) * 100) / 100);
                  const precisaCobrar = b.payment_plan === "sinal" && restante > 0;
                  return (
                    <div key={b.id} className="flex flex-col text-[12px] py-1 border-b border-hline last:border-b-0">
                      <div className="flex items-center justify-between">
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
                      <span
                        className="text-[11px] mt-0.5"
                        style={{ color: precisaCobrar ? "#F2600C" : "#22c55e" }}
                      >
                        {precisaCobrar
                          ? `💰 Cobrar na hora: R$ ${restante.toFixed(2)}`
                          : `✅ Pago 100% (R$ ${total.toFixed(2)})`}
                      </span>
                    </div>
                  );
                })}
              </div>

              {!loading && guidesForTurno.length === 0 && (
                <p className="text-[11px] text-[#ef4444] mt-3">
                  Nenhum guia ativo cadastrado pra esse turno — cadastre na aba GUIAS.
                </p>
              )}

              {bookingsForTurno.length > 0 && (
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
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
