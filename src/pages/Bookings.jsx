import React from "react";
import { Clock, Users } from "lucide-react";
import { TopBar, Pill } from "../components/UI.jsx";
import { useBooking } from "../context/BookingContext.jsx";

const PAST_BOOKINGS = [
  { tour: "PASSEIO MATINAL", date: "02 JUN · 08:00", status: "Concluído", people: 2, isExample: true },
];

export default function Bookings() {
  const { lastConfirmedBooking } = useBooking();

  const upcoming = lastConfirmedBooking
    ? [
        {
          tour: lastConfirmedBooking.tourName,
          date: `${lastConfirmedBooking.time}`,
          status: "Confirmado",
          people: lastConfirmedBooking.participants,
        },
      ]
    : [];

  const all = [...upcoming, ...PAST_BOOKINGS];

  return (
    <div className="flex-1 overflow-y-auto bg-charcoal">
      <TopBar title="MINHAS RESERVAS" />
      <div className="px-4 py-4 flex flex-col gap-3">
        {all.length === 0 && <p className="text-muted text-sm text-center mt-8">Você ainda não tem reservas.</p>}
        {all.map((b, i) => (
          <div
            key={i}
            className={`rounded-xl p-4 border ${
              b.isExample ? "bg-stone/40 border-dashed border-sky-500" : "bg-stone border-hline"
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="font-display text-white text-base">{b.tour}</div>
              <div className="flex items-center gap-1.5">
                {b.isExample && (
                  <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-sky-500 text-white tracking-wide">
                    EXEMPLO
                  </span>
                )}
                <Pill>{b.status}</Pill>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1">
                <Clock size={12} color="#B7AFA2" />
                <span className="text-[11px] text-muted">{b.date}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users size={12} color="#B7AFA2" />
                <span className="text-[11px] text-muted">{b.people} pessoa(s)</span>
              </div>
            </div>
            {b.isExample && (
              <p className="text-[10px] text-sky-400 mt-2 italic">
                Isto é só um exemplo de como sua reserva vai aparecer aqui — não é uma reserva real.
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
