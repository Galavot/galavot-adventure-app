import React from "react";
import { Star } from "lucide-react";
import Reveal from "./Reveal.jsx";

// Depoimentos fictícios — troque pelos reais assim que tiver avaliações
// de clientes. Basta editar este array (name, text, initial).
const TESTIMONIALS = [
  {
    name: "Marina S.",
    text: "Experiência incrível! Guia super atencioso e a cachoeira no final foi o ponto alto do passeio.",
  },
  {
    name: "Rafael T.",
    text: "Já fiz trilha em vários lugares, mas essa rota com vista da Pedra do Elefante é surreal. Recomendo demais.",
  },
  {
    name: "Camila e Bruno",
    text: "Fizemos o vespertino em casal e foi perfeito pra fechar o dia. Equipamentos bons e equipe muito segura.",
  },
];

export default function Testimonials() {
  return (
    <div className="px-5 mt-2 pb-2">
      <div className="font-display text-white text-lg">QUEM JÁ VIVEU A AVENTURA</div>
      <div className="flex gap-3 mt-3 overflow-x-auto pb-2">
        {TESTIMONIALS.map((t, i) => (
          <Reveal key={i} delay={i * 80} className="flex-shrink-0">
            <div className="rounded-xl p-4 bg-stone border border-hline" style={{ width: 240 }}>
              <div className="flex gap-0.5 mb-2">
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star key={s} size={13} color="#F2600C" fill="#F2600C" />
                ))}
              </div>
              <p className="text-[12px] text-cream leading-relaxed">"{t.text}"</p>
              <p className="text-[11px] text-muted mt-2 font-semibold">{t.name}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
