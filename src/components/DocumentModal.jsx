import React, { useEffect } from "react";
import { X } from "lucide-react";

// Modal de documento: diferente do PhotoModal, aqui a imagem é exibida em
// largura total dentro de um container com scroll vertical, porque os
// documentos (manual de pilotagem, termo de responsabilidade) são infográficos
// longos e densos que precisam ser lidos, não apenas visualizados.
//
// O cabeçalho tem uma dica visual (texto laranja + seta) apontando pro botão
// de fechar, deixando claro pro usuário que ele deve ler o documento e
// depois tocar no X pra continuar a reserva. A seta é posicionada de forma
// relativa (ancorada em "right") pra funcionar em qualquer largura de tela.
export default function DocumentModal({ src, alt, title, onClose }) {
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  if (!src) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/95"
      role="dialog"
      aria-modal="true"
      aria-label={alt || title || "Documento"}
    >
      <div className="relative bg-charcoal border-b border-hline shrink-0" style={{ height: 88 }}>
        <span
          className="absolute left-4 top-[14px] text-[15px] font-semibold text-cream"
          style={{ maxWidth: "calc(100% - 130px)" }}
        >
          {title}
        </span>

        <button
          onClick={onClose}
          className="absolute right-4 top-[14px] w-9 h-9 rounded-full flex items-center justify-center bg-stone border border-hline"
          aria-label="Fechar"
        >
          <X size={18} color="#fff" />
        </button>

        <span
          className="absolute right-4 text-[10px] italic font-semibold text-orange whitespace-nowrap"
          style={{ top: 58 }}
        >
          Após a leitura, clique no X
        </span>

        <svg
          width="120"
          height="88"
          viewBox="0 0 120 88"
          className="absolute right-0 top-0 pointer-events-none"
        >
          <defs>
            <marker id="doc-modal-arrow" markerWidth="9" markerHeight="9" refX="2.6" refY="4.5" orient="auto" markerUnits="userSpaceOnUse">
              <path d="M0,0 L9,4.5 L0,9 Z" fill="#F2600C" />
            </marker>
          </defs>
          <path
            d="M48,60 Q58,50 73,45"
            fill="none"
            stroke="#F2600C"
            strokeWidth="1.6"
            strokeLinecap="round"
            markerEnd="url(#doc-modal-arrow)"
          />
        </svg>
      </div>
      <div className="flex-1 overflow-y-auto">
        <img src={src} alt={alt || title || ""} className="w-full h-auto block" />
      </div>
    </div>
  );
}
