import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Clock, AlertCircle, Check, X } from "lucide-react";
import { TopBar, TrailProgress, PrimaryButton } from "../components/UI.jsx";
import { TOURS } from "../data.js";
import { useBooking } from "../context/BookingContext.jsx";

export default function BookingDateTime() {
  const { id } = useParams();
  const navigate = useNavigate();
  const tour = TOURS.find((t) => t.id === id);
  const { dates, selectedDateIndex, setSelectedDateIndex, setSelectedTime } = useBooking();

  // Mapa { "2026-07-22": vagasDisponiveis, ... } com a disponibilidade das
  // 30 datas de uma vez só — alimenta tanto o selinho verde/vermelho de
  // cada botão quanto o resumo da data selecionada.
  const [availabilityMap, setAvailabilityMap] = useState({});
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (tour) setSelectedTime(tour.time);
  }, [tour, setSelectedTime]);

  const loadAvailability = useCallback(async () => {
    if (!tour || dates.length === 0) return;
    setChecking(true);
    try {
      const isoList = dates.map((d) => d.iso).join(",");
      const res = await fetch(
        `/api/check-availability-batch?tourId=${tour.id}&dates=${isoList}&max=${tour.maxQuadriciclos}`
      );
      const data = await res.json();
      setAvailabilityMap(data.availability || {});
    } catch (err) {
      // Se a checagem falhar, não bloqueia o cliente — assume tudo disponível
      const fallback = {};
      dates.forEach((d) => {
        fallback[d.iso] = tour.maxQuadriciclos;
      });
      setAvailabilityMap(fallback);
    } finally {
      setChecking(false);
    }
  }, [tour, dates]);

  useEffect(() => {
    loadAvailability();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tour]);

  if (!tour) return <div className="p-6 text-white">Passeio não encontrado.</div>;

  const selectedIso = dates[selectedDateIndex]?.iso;
  const selectedAvailable = availabilityMap[selectedIso];
  const esgotado = !checking && selectedAvailable !== undefined && selectedAvailable <= 0;

  return (
    <div className="flex-1 overflow-y-auto bg-charcoal flex flex-col">
      <TopBar title="ESCOLHA O DIA" showBack />
      <TrailProgress step={2} total={4} />
      <div className="px-4">
        <div className="flex items-center gap-2 rounded-lg px-4 py-3 bg-stone border border-hline">
          <Clock size={16} color="#F2600C" />
          <div>
            <div className="font-display text-white text-[16px]">{tour.name}</div>
            <div className="text-[11px] text-muted">Saída: {tour.time} · Duração: {tour.duration}</div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-5">
          <span className="font-display text-muted text-sm tracking-wide">ESCOLHA O DIA</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-[10px] text-muted">
              <span className="w-2 h-2 rounded-full" style={{ background: "#22c55e" }} /> tem vaga
            </span>
            <span className="flex items-center gap-1.5 text-[10px] text-muted">
              <span className="w-2 h-2 rounded-full" style={{ background: "#ef4444" }} /> lotado
            </span>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 mt-2">
          {dates.map((d, i) => {
            const active = selectedDateIndex === i;
            const available = availabilityMap[d.iso];
            const isFull = !checking && available !== undefined && available <= 0;
            return (
              <button
                key={i}
                onClick={() => setSelectedDateIndex(i)}
                className={`relative flex flex-col items-center rounded-lg px-2 py-3 border ${
                  active ? "bg-orange border-orange" : "bg-stone border-hline"
                }`}
              >
                <span className={`text-[10px] font-bold ${active ? "text-ink" : "text-muted"}`}>{d.label}</span>
                <span className={`font-display text-[16px] ${active ? "text-ink" : "text-white"}`}>{d.sub}</span>

                {!checking && available !== undefined && (
                  <span
                    className="absolute -bottom-1.5 -right-1.5 w-[17px] h-[17px] rounded-full flex items-center justify-center border-2 border-charcoal"
                    style={{ background: isFull ? "#ef4444" : "#22c55e" }}
                  >
                    {isFull ? (
                      <X size={9} color="#fff" strokeWidth={3} />
                    ) : (
                      <Check size={9} color="#fff" strokeWidth={3} />
                    )}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-4 rounded-lg px-4 py-3 bg-stone border border-hline flex items-center justify-between">
          {checking ? (
            <span className="text-[12px] text-muted">Verificando vagas...</span>
          ) : selectedAvailable !== undefined ? (
            <>
              <span className="text-[12px] text-cream">
                Vagas disponíveis nesse dia ({tour.maxQuadriciclos} quadriciclos/turno)
              </span>
              <span className={`font-display text-base ${esgotado ? "text-orange" : "text-white"}`}>
                {esgotado ? "ESGOTADO" : `${selectedAvailable} de ${tour.maxQuadriciclos}`}
              </span>
            </>
          ) : null}
        </div>

        {esgotado && (
          <div className="flex items-start gap-2 rounded-lg px-3 py-3 mt-3 bg-stone border border-orange">
            <AlertCircle size={16} color="#F2600C" className="flex-shrink-0 mt-0.5" />
            <span className="text-[11px] text-cream leading-relaxed">
              Esse dia já está com todas as vagas do turno preenchidas. Escolha outra data acima (as com selo
              vermelho também estão lotadas).
            </span>
          </div>
        )}
      </div>
      <div className="px-4 pb-6 mt-auto pt-4">
        <PrimaryButton onClick={() => navigate(`/passeio/${id}/dados`)} disabled={esgotado || checking}>
          CONTINUAR
        </PrimaryButton>
      </div>
    </div>
  );
}
