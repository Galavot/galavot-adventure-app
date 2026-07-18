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
        <div className="flex items-center justify-between px-5 pt-5 pb-3 sticky top-0 bg-charcoal">
          <div className="font-display text-white text-xl">COMO FUNCIONA</div>
          <button onClick={onClose} aria-label="Fechar" className="w-8 h-8 rounded-full flex items-center justify-center bg-stone">
            <X size={16} color="#fff" />
          </button>
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
