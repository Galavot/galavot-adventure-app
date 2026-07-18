import React from "react";
import { useNavigate } from "react-router-dom";
import { Mountain, Clock, MapPin } from "lucide-react";
import { TopBar, Pill } from "../components/UI.jsx";
import Reveal from "../components/Reveal.jsx";
import { TOURS } from "../data.js";

export default function Tours() {
  const navigate = useNavigate();
  return (
    <div className="flex-1 overflow-y-auto bg-charcoal">
      <TopBar title="PASSEIOS" />
      <div className="px-4 py-4 flex flex-col gap-4">
        {TOURS.map((t, i) => (
          <Reveal key={t.id} delay={i * 80}>
            <div className="rounded-xl overflow-hidden bg-stone border border-hline transition-transform hover:border-orange">
              <div className="h-28 flex items-center justify-center bg-ink overflow-hidden">
                {t.image ? (
                  <img src={t.image} alt={t.name} loading="lazy" className="w-full h-full object-cover" />
                ) : (
                  <Mountain size={34} color="#F2600C" />
                )}
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <div className="font-display text-white text-lg">{t.name}</div>
                  <Pill>{t.level}</Pill>
                </div>
                <div className="text-xs text-muted mt-1.5 leading-relaxed">{t.desc}</div>
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex items-center gap-1">
                    <Clock size={13} color="#B7AFA2" />
                    <span className="text-[11px] text-muted">{t.duration}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin size={13} color="#B7AFA2" />
                    <span className="text-[11px] text-muted">Guarapari - ES</span>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-4">
                  <div className="font-display text-orange text-xl">
                    R$ {t.price}
                    <span className="font-body text-[11px] text-muted"> /quadriciclo</span>
                  </div>
                  <button
                    onClick={() => navigate(`/passeio/${t.id}`)}
                    aria-label={`Ver detalhes do ${t.name}`}
                    className="px-4 py-2 rounded-lg font-display text-sm bg-orange text-ink transition-transform active:scale-95"
                  >
                    VER DETALHES
                  </button>
                </div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
