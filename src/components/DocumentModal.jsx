import React, { useEffect } from "react";
import { X } from "lucide-react";

// Modal de documento: diferente do PhotoModal, aqui a imagem é exibida em
// largura total dentro de um container com scroll vertical, porque os
// documentos (manual de pilotagem, termo de responsabilidade) são infográficos
// longos e densos que precisam ser lidos, não apenas visualizados.
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
      <div className="flex items-center justify-between px-4 py-3 bg-charcoal border-b border-hline shrink-0">
        <span className="text-[13px] font-semibold text-cream truncate pr-3">{title}</span>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full flex items-center justify-center bg-stone border border-hline shrink-0"
          aria-label="Fechar"
        >
          <X size={18} color="#fff" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <img src={src} alt={alt || title || ""} className="w-full h-auto block" />
      </div>
    </div>
  );
}
