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
      <button
        onClick={onClose}
        className="absolute top-5 right-5 w-9 h-9 rounded-full flex items-center justify-center bg-stone border border-hline"
        aria-label="Fechar"
      >
        <X size={18} color="#fff" />
      </button>
      <img
        src={src}
        alt={alt || ""}
        className="max-h-full max-w-full rounded-lg object-contain animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
