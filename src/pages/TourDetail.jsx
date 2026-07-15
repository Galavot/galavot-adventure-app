import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Mountain, Fuel, ShieldCheck, Minus, Plus } from "lucide-react";
import { TopBar, TrailProgress, PrimaryButton } from "../components/UI.jsx";
import { TOURS } from "../data.js";
import { useBooking } from "../context/BookingContext.jsx";

export default function TourDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const tour = TOURS.find((t) => t.id === id);
  const { participants, setParticipants } = useBooking();

  if (!tour) return <div className="p-6 text-white">Passeio não encontrado.</div>;

  return (
    <div className="flex-1 overflow-y-auto bg-charcoal flex flex-col">
      <TopBar title={tour.name} showBack />
      <TrailProgress step={1} total={4} />
      <div className="px-4 pb-4">
        <div className="h-32 rounded-xl mb-4 flex items-center justify-center bg-ink">
          <Mountain size={38} color="#F2600C" />
        </div>
        <div className="text-cream text-[13px] leading-relaxed">{tour.desc}</div>

        <div className="mt-4 flex flex-col gap-2">
          {tour.includes.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              {i === 1 ? <Fuel size={14} color="#6E7A4F" /> : <ShieldCheck size={14} color="#6E7A4F" />}
              <span className="text-xs text-cream">{item}</span>
            </div>
          ))}
        </div>

        <div className="mt-3 rounded-lg px-3 py-2 bg-stone border border-hline">
          <span className="text-[11px] text-muted">{tour.weight}</span>
        </div>

        <div className="mt-5 flex items-center justify-between rounded-xl p-4 bg-stone">
          <div>
            <div className="font-display text-white text-[15px]">PARTICIPANTES</div>
            <div className="text-[11px] text-muted">Máx. 2 pessoas por quadriciclo</div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setParticipants(Math.max(1, participants - 1))}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-ink"
              aria-label="Diminuir"
            >
              <Minus size={14} color="#fff" />
            </button>
            <span className="font-display text-white text-xl min-w-[16px] text-center">{participants}</span>
            <button
              onClick={() => setParticipants(Math.min(2, participants + 1))}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-orange"
              aria-label="Aumentar"
            >
              <Plus size={14} color="#151311" />
            </button>
          </div>
        </div>
      </div>
      <div className="px-4 pb-6 mt-auto pt-2">
        <PrimaryButton onClick={() => navigate(`/passeio/${id}/data-horario`)}>
          ESCOLHER DATA E HORÁRIO
        </PrimaryButton>
      </div>
    </div>
  );
}
