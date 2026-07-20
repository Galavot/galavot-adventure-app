import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Clock, AlertCircle } from "lucide-react";
import { TopBar, TrailProgress, PrimaryButton } from "../components/UI.jsx";
import { TOURS } from "../data.js";
import { useBooking } from "../context/BookingContext.jsx";

export default function BookingDateTime() {
  const { id } = useParams();
  const navigate = useNavigate();
  const tour = TOURS.find((t) => t.id === id);
  const { dates, selectedDateIndex, setSelectedDateIndex, setSelectedTime } = useBooking();
  const [availability, setAvailability] = useState(null); // { booked, max, available }
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (tour) setSelectedTime(tour.time);
  }, [tour, setSelectedTime]);

  const checkAvailability = useCallback(
    async (dateIso) => {
      if (!tour) return;
      setChecking(true);
      setAvailability(null);
      try {
        const res = await fetch(
          `/api/check-availability?tourId=${tour.id}&date=${dateIso}&max=${tour.maxQuadriciclos}`
        );
        const data = await res.json();
        setAvailability(data);
      } catch (err) {
        // Se a checagem falhar, não bloqueia o cliente — assume disponível
        setAvailability({ booked: 0, max: tour.maxQuadriciclos, available: tour.maxQuadriciclos });
      } finally {
        setChecking(false);
      }
    },
    [tour]
  );

  useEffect(() => {
    if (tour && dates[selectedDateIndex]) {
      checkAvailability(dates[selectedDateIndex].iso);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDateIndex, tour]);

  if (!tour) return <div className="p-6 text-white">Passeio não encontrado.</div>;

  const esgotado = availability && availability.available <= 0;

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

        <div className="font-display text-muted text-sm tracking-wide mt-5">ESCOLHA O DIA</div>
        <div className="grid grid-cols-4 gap-2 mt-2">
          {dates.map((d, i) => {
            const active = selectedDateIndex === i;
            return (
              <button
                key={i}
                onClick={() => setSelectedDateIndex(i)}
                className={`flex flex-col items-center rounded-lg px-2 py-3 border ${
                  active ? "bg-orange border-orange" : "bg-stone border-hline"
                }`}
              >
                <span className={`text-[10px] font-bold ${active ? "text-ink" : "text-muted"}`}>{d.label}</span>
                <span className={`font-display text-[16px] ${active ? "text-ink" : "text-white"}`}>{d.sub}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 rounded-lg px-4 py-3 bg-stone border border-hline flex items-center justify-between">
          {checking ? (
            <span className="text-[12px] text-muted">Verificando vagas...</span>
          ) : availability ? (
            <>
              <span className="text-[12px] text-cream">
                Vagas disponíveis nesse dia ({tour.maxQuadriciclos} quadriciclos/turno)
              </span>
              <span className={`font-display text-base ${esgotado ? "text-orange" : "text-white"}`}>
                {esgotado ? "ESGOTADO" : `${availability.available} de ${availability.max}`}
              </span>
            </>
          ) : null}
        </div>

        {esgotado && (
          <div className="flex items-start gap-2 rounded-lg px-3 py-3 mt-3 bg-stone border border-orange">
            <AlertCircle size={16} color="#F2600C" className="flex-shrink-0 mt-0.5" />
            <span className="text-[11px] text-cream leading-relaxed">
              Esse dia já está com todas as vagas do turno preenchidas. Escolha outra data acima.
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
