import React from "react";
import { Clock, Users } from "lucide-react";
import { TopBar, Pill } from "../components/UI.jsx";
import { useBooking } from "../context/BookingContext.jsx";

const PAST_BOOKINGS = [
  { tour: "PASSEIO MATINAL", date: "02 JUN · 08:00", status: "Concluído", people: 4 },
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
          <div key={i} className="rounded-xl p-4 bg-stone border border-hline">
            <div className="flex justify-between items-start">
              <div className="font-display text-white text-base">{b.tour}</div>
              <Pill>{b.status}</Pill>
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
          </div>
        ))}
      </div>
    </div>
  );
}
