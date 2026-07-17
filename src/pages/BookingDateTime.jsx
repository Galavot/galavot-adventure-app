import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Clock } from "lucide-react";
import { TopBar, TrailProgress, PrimaryButton } from "../components/UI.jsx";
import { TOURS } from "../data.js";
import { useBooking } from "../context/BookingContext.jsx";

export default function BookingDateTime() {
  const { id } = useParams();
  const navigate = useNavigate();
  const tour = TOURS.find((t) => t.id === id);
  const { dates, selectedDateIndex, setSelectedDateIndex, setSelectedTime } = useBooking();

  useEffect(() => {
    if (tour) setSelectedTime(tour.time);
  }, [tour, setSelectedTime]);

  if (!tour) return <div className="p-6 text-white">Passeio não encontrado.</div>;

  return (
    <div className="flex-1 overflow-y-auto bg-charcoal flex flex-col">
      <TopBar title="ESCOLHA O DIA" showBack />
      <TrailProgress step={2} total={4} />
      <div className="px-4">
        <div className="flex items-center gap-2 rounded-lg px-4 py-3 bg-stone border border-hline">
          <Clock size={16} color="#F2600C" />
          <div>
            <div className="font-display text-white text-[16px]">{tour.name}</div>
            <div className="text-[11px] text-muted">Horário fixo: {tour.time}</div>
          </div>
        </div>

        <div className="font-display text-muted text-sm tracking-wide mt-5">ESCOLHA O DIA</div>
        <div className="grid grid-cols-3 gap-2 mt-2">
          {dates.map((d, i) => {
            const active = selectedDateIndex === i;
            return (
              <button
                key={i}
                onClick={() => setSelectedDateIndex(i)}
                className={`flex flex-col items-center rounded-lg px-3 py-3 border ${
                  active ? "bg-orange border-orange" : "bg-stone border-hline"
                }`}
              >
                <span className={`text-[10px] font-bold ${active ? "text-ink" : "text-muted"}`}>{d.label}</span>
                <span className={`font-display text-[16px] ${active ? "text-ink" : "text-white"}`}>{d.sub}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="px-4 pb-6 mt-auto pt-4">
        <PrimaryButton onClick={() => navigate(`/passeio/${id}/dados`)}>CONTINUAR</PrimaryButton>
      </div>
    </div>
  );
}
