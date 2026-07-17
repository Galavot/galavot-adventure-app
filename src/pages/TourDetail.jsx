import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Mountain, ShieldCheck, Minus, Plus, Clock, MapPin, Gauge, Check, X } from "lucide-react";
import { TopBar, TrailProgress, PrimaryButton } from "../components/UI.jsx";
import { TOURS, ROUTE_STOPS, ROUTE_INFO } from "../data.js";
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
        <div className="h-40 rounded-xl mb-4 flex items-center justify-center bg-ink overflow-hidden">
          {tour.image ? (
            <img src={tour.image} alt={tour.name} className="w-full h-full object-cover" />
          ) : (
            <Mountain size={38} color="#F2600C" />
          )}
        </div>
        <div className="text-cream text-[13px] leading-relaxed">{tour.desc}</div>

        <div className="flex gap-2 mt-3">
          <div className="flex-1 rounded-lg px-3 py-2 bg-stone border border-hline flex flex-col items-center">
            <Clock size={14} color="#F2600C" />
            <span className="text-[11px] text-cream mt-1">{ROUTE_INFO.duration}</span>
          </div>
          <div className="flex-1 rounded-lg px-3 py-2 bg-stone border border-hline flex flex-col items-center">
            <MapPin size={14} color="#F2600C" />
            <span className="text-[11px] text-cream mt-1">{ROUTE_INFO.distance}</span>
          </div>
          <div className="flex-1 rounded-lg px-3 py-2 bg-stone border border-hline flex flex-col items-center">
            <Gauge size={14} color="#F2600C" />
            <span className="text-[11px] text-cream mt-1">Nível {ROUTE_INFO.level}</span>
          </div>
        </div>

        <div className="font-display text-muted text-sm tracking-wide mt-5">O ROTEIRO</div>
        <div className="flex flex-col gap-3 mt-2">
          {ROUTE_STOPS.map((stop, i) => (
            <div key={i} className="flex gap-3">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold bg-orange text-ink"
                style={{ marginTop: 1 }}
              >
                {i + 1}
              </div>
              <div>
                <div className="text-white text-[13px] font-semibold">{stop.title}</div>
                <div className="text-muted text-[11px] leading-relaxed mt-0.5">{stop.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 mt-5">
          <div className="rounded-lg px-3 py-3 bg-stone border border-hline">
            <div className="text-[11px] font-semibold text-moss mb-1.5">INCLUSO</div>
            {ROUTE_INFO.included.map((item, i) => (
              <div key={i} className="flex items-start gap-1.5 mb-1">
                <Check size={12} color="#6E7A4F" className="flex-shrink-0 mt-0.5" />
                <span className="text-[11px] text-cream">{item}</span>
              </div>
            ))}
          </div>
          <div className="rounded-lg px-3 py-3 bg-stone border border-hline">
            <div className="text-[11px] font-semibold text-orange mb-1.5">NÃO INCLUSO</div>
            {ROUTE_INFO.notIncluded.map((item, i) => (
              <div key={i} className="flex items-start gap-1.5 mb-1">
                <X size={12} color="#F2600C" className="flex-shrink-0 mt-0.5" />
                <span className="text-[11px] text-cream">{item}</span>
              </div>
            ))}
          </div>
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
