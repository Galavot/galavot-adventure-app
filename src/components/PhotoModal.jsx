import React, { useEffect } from "react";
import { X } from "lucide-react";

// Lightbox genérico: recebe uma imagem e mostra em tela cheia, com fundo
// escurecido. Fecha ao clicar fora, no X, ou apertando ESC.
export default function PhotoModal({ src, alt, onClose }) {
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={alt || "Foto ampliada"}
    >
      <div className="absolute top-5 right-5" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full flex items-center justify-center bg-stone border border-hline"
          aria-label="Fechar"
        >
          <X size={18} color="#fff" />
        </button>
        <span
          className="absolute right-11 top-2.5 text-[10px] italic font-semibold text-orange whitespace-nowrap"
        >
          Toque no X pra voltar
        </span>
        <svg width="170" height="46" viewBox="0 0 170 46" style={{ position: "absolute", right: 0, top: -10 }} className="pointer-events-none">
          <defs>
            <marker id="photo-modal-arrow" markerWidth="9" markerHeight="9" refX="2.6" refY="4.5" orient="auto" markerUnits="userSpaceOnUse">
              <path d="M0,0 L9,4.5 L0,9 Z" fill="#F2600C" />
            </marker>
          </defs>
          <path
            d="M6,14 C 55,-6 95,4 125,34"
            fill="none"
            stroke="#F2600C"
            strokeWidth="1.6"
            strokeLinecap="round"
            markerEnd="url(#photo-modal-arrow)"
          />
        </svg>
      </div>
      <img
        src={src}
        alt={alt || ""}
        className="max-h-full max-w-full rounded-lg object-contain animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
