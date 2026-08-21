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
      <div
        className="absolute top-2 right-2"
        style={{ width: 120, height: 88 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-5 top-4 w-8 h-8 rounded-full flex items-center justify-center bg-stone border border-hline"
          aria-label="Fechar"
        >
          <X size={16} color="#fff" />
        </button>
        <span
          className="absolute right-5 text-[10px] italic font-semibold text-orange whitespace-nowrap"
          style={{ top: 58 }}
        >
          Toque no X pra voltar
        </span>
        <svg width="120" height="88" viewBox="0 0 120 88" className="absolute right-0 top-0 pointer-events-none">
          <defs>
            <marker id="photo-modal-arrow" markerWidth="9" markerHeight="9" refX="2.6" refY="4.5" orient="auto" markerUnits="userSpaceOnUse">
              <path d="M0,0 L9,4.5 L0,9 Z" fill="#F2600C" />
            </marker>
          </defs>
          <path
            d="M50,60 Q60,50 74,44"
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
