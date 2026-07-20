import React, { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { TopBar } from "../components/UI.jsx";

// Perguntas frequentes — conteúdo baseado no Manual de Pilotagem Segura e
// no Termo de Responsabilidade oficiais da Galavot Adventure (regras de
// segurança, capacidade de peso, idade mínima, emergência e respeito à
// natureza). As perguntas sobre política de operação (chuva, remarcação)
// seguem o que já foi combinado com o Sidnei — revisar se mudar.
const FAQ_ITEMS = [
  {
    q: "Preciso de CNH para pilotar o quadriciclo?",
    a: "Sim. Para pilotar é obrigatório apresentar CNH válida no check-in. Quem for de garupa não precisa de habilitação.",
  },
  {
    q: "Qual a idade mínima para participar?",
    a: "A partir de 10 anos, sempre acompanhado dos pais ou responsável durante todo o passeio.",
  },
  {
    q: "Qual o peso máximo permitido?",
    a: "180kg no total, somando piloto + passageiro. Essa capacidade é verificada antes da saída.",
  },
  {
    q: "Quanto tempo dura o passeio e que horas começa?",
    a: "O passeio Matinal sai a partir das 9h e o Vespertino a partir das 13h. A duração varia de 3h a 4h, dependendo do ritmo do grupo.",
  },
  {
    q: "E se chover no dia do passeio?",
    a: "O passeio acontece normalmente com chuva fraca a moderada — faz parte da aventura! Em caso de temporal ou risco real de segurança, o passeio é remarcado sem custo.",
  },
  {
    q: "Posso cancelar ou remarcar minha reserva?",
    a: "Sim, é só chamar no WhatsApp com antecedência que a gente remarca sem custo adicional.",
  },
  {
    q: "Quais são as regras de segurança durante o passeio?",
    a: "Seguir sempre as orientações do guia, manter distância segura do quadriciclo da frente, respeitar os limites de velocidade do percurso, não fazer manobras perigosas ou arriscadas, não ultrapassar sem autorização do guia e não consumir álcool ou drogas antes ou durante a atividade.",
  },
  {
    q: "O que fazer em caso de emergência?",
    a: "Pare o veículo em local seguro, comunique imediatamente o guia e aguarde instruções. Nunca abandone o grupo sem autorização.",
  },
  {
    q: "Existe alguma regra de respeito à natureza?",
    a: "Sim: não jogar lixo nas trilhas, não danificar a vegetação, não assustar os animais e utilizar apenas as trilhas autorizadas.",
  },
];

export default function Faq() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <div className="flex-1 overflow-y-auto bg-charcoal flex flex-col">
      <TopBar title="PERGUNTAS FREQUENTES" showBack />
      <div className="px-4 pb-6 flex flex-col gap-2.5">
        {FAQ_ITEMS.map((item, i) => {
          const open = openIndex === i;
          return (
            <div key={i} className="rounded-xl bg-stone border border-hline overflow-hidden">
              <button
                onClick={() => setOpenIndex(open ? null : i)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left"
              >
                <span className="flex items-start gap-2.5 text-[13px] font-semibold text-cream leading-snug">
                  <HelpCircle size={15} color="#F2600C" className="flex-shrink-0 mt-0.5" />
                  {item.q}
                </span>
                <ChevronDown
                  size={16}
                  color="#F2600C"
                  className="flex-shrink-0 transition-transform duration-200"
                  style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
                />
              </button>
              {open && (
                <div className="px-4 pb-4 pl-[42px]">
                  <p className="text-[12px] text-muted leading-relaxed">{item.a}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
