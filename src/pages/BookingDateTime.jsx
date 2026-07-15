import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Clock } from "lucide-react";
import { TopBar, TrailProgress, PrimaryButton } from "../components/UI.jsx";
import { DATES, SLOTS } from "../data.js";
import { useBooking } from "../context/BookingContext.jsx";

export default function BookingDateTime() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selectedDateIndex, setSelectedDateIndex, selectedTime, setSelectedTime } = useBooking();

  return (
    <div className="flex-1 overflow-y-auto bg-charcoal flex flex-col">
      <TopBar title="DATA E HORÁRIO" showBack />
      <TrailProgress step={2} total={4} />
      <div className="px-4">
        <div className="font-display text-muted text-sm tracking-wide">ESCOLHA O DIA</div>
        <div className="flex gap-2 mt-2 overflow-x-auto pb-2">
          {DATES.map((d, i) => {
            const active = selectedDateIndex === i;
            return (
              <button
                key={i}
                onClick={() => setSelectedDateIndex(i)}
                className={`flex flex-col items-center rounded-lg px-3 py-2 flex-shrink-0 border ${
                  active ? "bg-orange border-orange" : "bg-stone border-hline"
                }`}
              >
                <span className={`text-[10px] font-bold ${active ? "text-ink" : "text-muted"}`}>{d.label}</span>
                <span className={`font-display text-[15px] ${active ? "text-ink" : "text-white"}`}>{d.sub}</span>
              </button>
            );
          })}
        </div>

        <div className="font-display text-muted text-sm tracking-wide mt-4">HORÁRIOS DISPONÍVEIS</div>
        <div className="flex flex-col gap-2 mt-2">
          {SLOTS.map((s, i) => {
            const esgotado = s.vagas === 0;
            const selected = selectedTime === s.time;
            return (
              <button
                key={i}
                disabled={esgotado}
                onClick={() => setSelectedTime(s.time)}
                className={`flex items-center justify-between rounded-lg px-4 py-3 border ${
                  selected ? "bg-orange border-orange" : "bg-stone border-hline"
                } ${esgotado ? "opacity-40" : ""}`}
              >
                <div className="flex items-center gap-2">
                  <Clock size={15} color={selected ? "#151311" : "#F5F0E6"} />
                  <span className={`font-display text-[17px] ${selected ? "text-ink" : "text-white"}`}>{s.time}</span>
                </div>
                <span className={`text-[11px] font-semibold ${selected ? "text-ink" : "text-muted"}`}>
                  {esgotado ? "ESGOTADO" : `${s.vagas} vagas`}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="px-4 pb-6 mt-auto pt-4">
        <PrimaryButton onClick={() => navigate(`/passeio/${id}/dados`)} disabled={!selectedTime}>
          CONTINUAR
        </PrimaryButton>
      </div>
    </div>
  );
}
