import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Phone, Instagram, Handshake, ChevronRight, Download, CheckCircle2, HelpCircle } from "lucide-react";
import { TopBar, Logo } from "../components/UI.jsx";
import InstallInstructionsModal from "../components/InstallInstructionsModal.jsx";
import { usePWAInstall } from "../hooks/usePWAInstall.js";
import { CONTACT, SECONDARY_CONTACT } from "../data.js";

export default function Profile() {
  const navigate = useNavigate();
  const { canInstall, isInstalled, platform, promptInstall } = usePWAInstall();
  const [showInstructions, setShowInstructions] = useState(false);

  const handleInstallClick = async () => {
    const result = await promptInstall();
    if (result === "manual") setShowInstructions(true);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-charcoal">
      <TopBar title="PERFIL" />
      <div className="flex flex-col items-center px-4 pt-4">
        <Logo size={80} />
        <div className="font-display text-white text-lg mt-3">GALAVOT ADVENTURE</div>
        <div className="text-xs text-muted">{CONTACT.city}</div>
        {CONTACT.cnpj && (
          <div className="text-[10px] text-muted mt-0.5">CNPJ {CONTACT.cnpj}</div>
        )}

        {(canInstall || isInstalled) && (
          <div className="w-full mt-5">
            {isInstalled ? (
              <div className="flex items-center justify-center gap-2 rounded-lg py-3 bg-stone border border-hline">
                <CheckCircle2 size={16} color="#6E7A4F" />
                <span className="text-[13px] font-semibold text-cream">App já instalado neste dispositivo</span>
              </div>
            ) : (
              <button
                onClick={handleInstallClick}
                className="w-full flex items-center justify-center gap-2 rounded-lg py-3 bg-orange text-ink"
              >
                <Download size={16} />
                <span className="font-display text-[15px] tracking-wide">BAIXAR O APP NO CELULAR</span>
              </button>
            )}
            <p className="text-[10px] text-muted text-center mt-1.5 px-4">
              Instala o app na sua tela inicial, sem ocupar espaço de loja e sem downloads pesados.
            </p>
          </div>
        )}

        <div className="font-display text-muted text-sm tracking-wide mt-6 self-start">GESTORES DA GALAVOT</div>
        <div className="w-full flex flex-col gap-2 mt-2">
          <a
            href={`https://wa.me/${CONTACT.whatsapp}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-lg px-4 py-3 bg-stone border border-hline"
          >
            <Phone size={16} color="#F2600C" />
            <span className="text-[13px] text-cream">
              {CONTACT.name} · {CONTACT.phone}
            </span>
          </a>
          <a
            href={`https://wa.me/${SECONDARY_CONTACT.whatsapp}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-lg px-4 py-3 bg-stone border border-hline"
          >
            <Phone size={16} color="#F2600C" />
            <span className="text-[13px] text-cream">
              {SECONDARY_CONTACT.name} · {SECONDARY_CONTACT.phone}
            </span>
          </a>
          <a
            href={CONTACT.instagramUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-lg px-4 py-3 bg-stone border border-hline"
          >
            <Instagram size={16} color="#F2600C" />
            <span className="text-[13px] text-cream">{CONTACT.instagram}</span>
          </a>
        </div>

        <button
          onClick={() => navigate("/faq")}
          className="w-full flex items-center gap-3 rounded-lg px-4 py-3 bg-stone border border-hline mt-6"
        >
          <HelpCircle size={16} color="#F2600C" />
          <span className="text-[13px] text-cream flex-1 text-left">Perguntas Frequentes</span>
          <ChevronRight size={16} color="#B7AFA2" />
        </button>

        <button
          onClick={() => navigate("/parceiro")}
          className="w-full flex items-center gap-3 rounded-lg px-4 py-3 bg-stone border border-hline mt-2"
        >
          <Handshake size={16} color="#F2600C" />
          <span className="text-[13px] text-cream flex-1 text-left">Login / Parceiro</span>
          <ChevronRight size={16} color="#B7AFA2" />
        </button>
      </div>

      {showInstructions && (
        <InstallInstructionsModal platform={platform} onClose={() => setShowInstructions(false)} />
      )}
    </div>
  );
}
