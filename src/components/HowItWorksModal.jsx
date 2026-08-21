import React, { useEffect } from "react";
import { X, CalendarCheck, MailCheck, Users, Mountain, Star } from "lucide-react";

const STEPS = [
  {
    icon: CalendarCheck,
    title: "Reserva",
    desc: "Escolha o passeio, a data e o horário direto pelo app.",
  },
  {
    icon: MailCheck,
    title: "Confirmação",
    desc: "Receba a confirmação da reserva e todas as orientações pelo WhatsApp.",
  },
  {
    icon: Users,
    title: "Encontro",
    desc: "Compareça ao ponto de encontro, receba os equipamentos e as instruções da equipe.",
  },
  {
    icon: Mountain,
    title: "Passeio",
    desc: "Curta a aventura com paradas para fotos, mirantes e muita segurança.",
  },
  {
    icon: Star,
    title: "Retorno",
    desc: "Volte ao ponto inicial, avalie sua experiência e conheça outros passeios.",
  },
];

export default function HowItWorksModal({ onClose }) {
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 p-0 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Como funciona"
    >
      <div
        className="w-full sm:max-w-sm bg-charcoal rounded-t-2xl sm:rounded-2xl border border-hline max-h-[85vh] overflow-y-auto animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative px-5 pt-5 pb-8 sticky top-0 bg-charcoal" style={{ height: 88 }}>
          <div className="font-display text-white text-xl absolute left-5 top-5" style={{ maxWidth: "calc(100% - 130px)" }}>
            COMO FUNCIONA
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="absolute right-5 top-4 w-8 h-8 rounded-full flex items-center justify-center bg-stone"
          >
            <X size={16} color="#fff" />
          </button>
          <span className="absolute right-5 text-[10px] italic font-semibold text-orange whitespace-nowrap" style={{ top: 58 }}>
            Toque no X pra voltar
          </span>
          <svg width="120" height="88" viewBox="0 0 120 88" className="absolute right-0 top-0 pointer-events-none">
            <defs>
              <marker id="how-modal-arrow" markerWidth="9" markerHeight="9" refX="2.6" refY="4.5" orient="auto" markerUnits="userSpaceOnUse">
                <path d="M0,0 L9,4.5 L0,9 Z" fill="#F2600C" />
              </marker>
            </defs>
            <path d="M50,60 Q60,50 74,44" fill="none" stroke="#F2600C" strokeWidth="1.6" strokeLinecap="round" markerEnd="url(#how-modal-arrow)" />
          </svg>
        </div>
        <div className="px-5 pb-6 flex flex-col">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            const isLast = i === STEPS.length - 1;
            return (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-orange flex-shrink-0">
                    <Icon size={18} color="#151311" />
                  </div>
                  {!isLast && <div className="w-px flex-1 my-1" style={{ background: "#413C35", minHeight: 28 }} />}
                </div>
                <div className={isLast ? "pb-0" : "pb-5"}>
                  <div className="font-display text-white text-[15px] mt-1.5">
                    {i + 1}. {step.title.toUpperCase()}
                  </div>
                  <div className="text-[12px] text-muted leading-relaxed mt-1">{step.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
