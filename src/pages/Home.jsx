import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Mountain, ShieldCheck, Camera, Clock, Instagram, Share2, X } from "lucide-react";
import { Logo, PrimaryButton } from "../components/UI.jsx";
import { TOURS, CONTACT } from "../data.js";

export default function Home() {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [showRouteMap, setShowRouteMap] = useState(false);

  const handleShare = async () => {
    const shareData = {
      title: "Galavot Adventure",
      text: "Reserve seu passeio de quadriciclo em Guarapari pelo app da Galavot Adventure!",
      url: window.location.origin,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // usuário cancelou o compartilhamento — não faz nada
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareData.url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        // clipboard indisponível — ignora silenciosamente
      }
    }
  };

  const benefitCards = [
    { icon: Users, label: "Aventura para Todos" },
    { icon: Mountain, label: "Cenários Incríveis", onClick: () => setShowRouteMap(true) },
    { icon: ShieldCheck, label: "Diversão Garantida" },
    { icon: Camera, label: "Momentos Inesquecíveis" },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-charcoal">
      <div
        className="px-5 pt-6 pb-8 relative overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: "url('/fotos/header-bg.jpg')" }}
      >
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(160deg, rgba(21,19,17,0.92) 35%, rgba(44,40,35,0.75) 100%)" }}
        />
        <div className="relative">
          <Logo size={64} />
        </div>
        <div className="relative mt-6">
          <div className="font-display text-white leading-[1.05]" style={{ fontSize: 34 }}>
            VIVA A
            <br />
            AVENTURA!
          </div>
          <div className="text-muted text-sm mt-2 max-w-[220px]">
            Descubra novos caminhos. Sinta a liberdade em Guarapari.
          </div>
          <div className="mt-5">
            <PrimaryButton onClick={() => navigate("/passeios")}>RESERVAR PASSEIO</PrimaryButton>
          </div>
          <div className="flex gap-2 mt-3">
            <a
              href="https://www.instagram.com/galavotadventureoficial?igsh=ZXl3cTY2bzJhOG5j"
              target="_blank"
              rel="noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2.5 bg-stone border border-hline"
            >
              <Instagram size={14} color="#F2600C" />
              <span className="text-[11px] font-semibold text-cream">Instagram</span>
            </a>
            <button
              onClick={handleShare}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2.5 bg-stone border border-hline"
            >
              <Share2 size={14} color="#F2600C" />
              <span className="text-[11px] font-semibold text-cream">{copied ? "Link copiado!" : "Compartilhar app"}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 px-5 mt-5">
        {benefitCards.map(({ icon: Icon, label, onClick }, i) => (
          <div
            key={i}
            onClick={onClick}
            className={`rounded-xl p-3 flex flex-col items-center text-center gap-2 bg-stone border border-hline ${
              onClick ? "cursor-pointer active:opacity-80" : ""
            }`}
          >
            <Icon size={20} color="#F2600C" />
            <span className="text-[11px] font-semibold text-cream">{label}</span>
          </div>
        ))}
      </div>

      <div className="px-5 mt-6 pb-4">
        <div className="font-display text-white text-lg">PRÓXIMOS PASSEIOS</div>
        <div className="flex gap-3 mt-3 overflow-x-auto pb-2">
          {TOURS.map((t) => (
            <div
              key={t.id}
              onClick={() => navigate(`/passeio/${t.id}`)}
              className="rounded-xl p-3 flex-shrink-0 bg-stone border border-hline cursor-pointer"
              style={{ width: 190 }}
            >
              <div className="h-20 rounded-lg mb-2 flex items-center justify-center bg-ink overflow-hidden">
                {t.image ? (
                  <img src={t.image} alt={t.name} className="w-full h-full object-cover" />
                ) : (
                  <Mountain size={26} color="#F2600C" />
                )}
              </div>
              <div className="font-display text-white text-[15px]">{t.name}</div>
              <div className="flex items-center gap-1 mt-1">
                <Clock size={12} color="#B7AFA2" />
                <span className="text-[11px] text-muted">{t.time}</span>
              </div>
              <div className="font-display text-orange text-base mt-1.5">
                R$ {t.price}
                <span className="font-body text-[10px] text-muted"> /quadriciclo</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showRouteMap && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setShowRouteMap(false)}
        >
          <button
            onClick={() => setShowRouteMap(false)}
            className="absolute top-5 right-5 w-9 h-9 rounded-full flex items-center justify-center bg-stone border border-hline"
            aria-label="Fechar"
          >
            <X size={18} color="#fff" />
          </button>
          <img
            src="/fotos/mapa-roteiro.jpg"
            alt="Roteiro do passeio"
            className="max-h-full max-w-full rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
