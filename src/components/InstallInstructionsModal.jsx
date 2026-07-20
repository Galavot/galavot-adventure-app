import React, { useEffect } from "react";
import { X, Share, SquarePlus, MoreVertical } from "lucide-react";

export default function InstallInstructionsModal({ platform, onClose }) {
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const isIOS = platform === "ios";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 p-0 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Como instalar o app"
    >
      <div
        className="w-full sm:max-w-sm bg-charcoal rounded-t-2xl sm:rounded-2xl border border-hline animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="font-display text-white text-xl">INSTALAR O APP</div>
          <button onClick={onClose} aria-label="Fechar" className="w-8 h-8 rounded-full flex items-center justify-center bg-stone">
            <X size={16} color="#fff" />
          </button>
        </div>
        <div className="px-5 pb-6 flex flex-col gap-4">
          {isIOS ? (
            <>
              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-orange flex-shrink-0">
                  <Share size={15} color="#151311" />
                </div>
                <p className="text-[13px] text-cream leading-relaxed pt-1">
                  Toque no ícone de <strong>Compartilhar</strong> na barra do Safari (o quadrado com a seta pra cima).
                </p>
              </div>
              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-orange flex-shrink-0">
                  <SquarePlus size={15} color="#151311" />
                </div>
                <p className="text-[13px] text-cream leading-relaxed pt-1">
                  Escolha <strong>"Adicionar à Tela de Início"</strong> na lista de opções.
                </p>
              </div>
              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-orange flex-shrink-0 text-ink font-display text-sm">
                  ✓
                </div>
                <p className="text-[13px] text-cream leading-relaxed pt-1">
                  Toque em <strong>"Adicionar"</strong> — pronto, o ícone da Galavot Adventure fica na sua tela.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-orange flex-shrink-0">
                  <MoreVertical size={15} color="#151311" />
                </div>
                <p className="text-[13px] text-cream leading-relaxed pt-1">
                  Toque no menu do navegador (geralmente os <strong>3 pontinhos</strong> no canto superior).
                </p>
              </div>
              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-orange flex-shrink-0">
                  <SquarePlus size={15} color="#151311" />
                </div>
                <p className="text-[13px] text-cream leading-relaxed pt-1">
                  Escolha <strong>"Instalar app"</strong> ou <strong>"Adicionar à tela inicial"</strong>.
                </p>
              </div>
              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-orange flex-shrink-0 text-ink font-display text-sm">
                  ✓
                </div>
                <p className="text-[13px] text-cream leading-relaxed pt-1">
                  Confirme — o ícone da Galavot Adventure aparece na sua tela, como um app de verdade.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
