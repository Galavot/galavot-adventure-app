import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Mountain, Camera, Clock, Instagram, Share2, PlayCircle, Sparkles } from "lucide-react";
import { Logo, PrimaryButton } from "../components/UI.jsx";
import PhotoModal from "../components/PhotoModal.jsx";
import HowItWorksModal from "../components/HowItWorksModal.jsx";
import Testimonials from "../components/Testimonials.jsx";
import Reveal from "../components/Reveal.jsx";
import { TOURS, CONTACT } from "../data.js";

export default function Home() {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [lightbox, setLightbox] = useState(null); // 'map' | 'explorers' | 'stories' | null
  const [showHowItWorks, setShowHowItWorks] = useState(false);

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
    { icon: Users, label: "Para Exploradores", onClick: () => setLightbox("explorers") },
    { icon: Mountain, label: "Cenários Incríveis", onClick: () => setLightbox("map") },
    { icon: Sparkles, label: "Como Funciona", onClick: () => setShowHowItWorks(true) },
    { icon: Camera, label: "Histórias que Ficam", onClick: () => setLightbox("stories") },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-charcoal">
      {/* HERO */}
      <div
        className="px-5 pt-6 pb-8 relative overflow-hidden bg-cover bg-center animate-fade-in"
        style={{ backgroundImage: "url('/fotos/header-bg.jpg')" }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(170deg, rgba(15,14,12,0.95) 25%, rgba(21,19,17,0.85) 60%, rgba(44,40,35,0.65) 100%)",
          }}
        />
        <div className="relative">
          <Logo size={64} />
        </div>
        <div className="relative mt-7">
          <div className="font-display text-white leading-[1.02]" style={{ fontSize: 36, textShadow: "0 2px 12px rgba(0,0,0,0.4)" }}>
            AVENTURA,
            <br />
            LIBERDADE E
            <br />
            <span style={{ color: "#F2600C" }}>NATUREZA</span>
          </div>
          <div className="text-cream text-[13px] mt-3 max-w-[240px] leading-relaxed">
            Passeios guiados de quadriciclo off-road em Guarapari — a aventura te espera.
          </div>
          <div className="mt-5 flex flex-col gap-2">
            <PrimaryButton onClick={() => navigate("/passeios")}>RESERVAR AGORA</PrimaryButton>
            <a
              href="https://www.instagram.com/galavotadventureoficial?igsh=ZXl3cTY2bzJhOG5j"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 rounded-lg py-3 border border-hline"
              style={{ background: "rgba(245,240,230,0.06)" }}
            >
              <PlayCircle size={16} color="#F5F0E6" />
              <span className="font-display text-cream text-[14px] tracking-wide">VER VÍDEOS REAIS</span>
            </a>
          </div>
          <div className="flex gap-2 mt-3">
            <a
              href="https://www.instagram.com/galavotadventureoficial?igsh=ZXl3cTY2bzJhOG5j"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram da Galavot Adventure"
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2.5 bg-stone border border-hline"
            >
              <Instagram size={14} color="#F2600C" />
              <span className="text-[11px] font-semibold text-cream">Instagram</span>
            </a>
            <button
              onClick={handleShare}
              aria-label="Compartilhar o app"
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2.5 bg-stone border border-hline"
            >
              <Share2 size={14} color="#F2600C" />
              <span className="text-[11px] font-semibold text-cream">{copied ? "Link copiado!" : "Compartilhar app"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* BENEFÍCIOS */}
      <div className="grid grid-cols-2 gap-3 px-5 mt-5">
        {benefitCards.map(({ icon: Icon, label, onClick }, i) => (
          <Reveal key={i} delay={i * 60}>
            <div
              onClick={onClick}
              role={onClick ? "button" : undefined}
              tabIndex={onClick ? 0 : undefined}
              aria-label={onClick ? label : undefined}
              className={`rounded-xl p-3 flex flex-col items-center text-center gap-2 bg-stone border border-hline transition-transform ${
                onClick ? "cursor-pointer active:scale-95 hover:border-orange" : ""
              }`}
            >
              <Icon size={20} color="#F2600C" />
              <span className="text-[11px] font-semibold text-cream">{label}</span>
            </div>
          </Reveal>
        ))}
      </div>

      {/* PRÓXIMOS PASSEIOS */}
      <div className="px-5 mt-6 pb-2">
        <div className="font-display text-white text-lg">PRÓXIMOS PASSEIOS</div>
        <div className="flex gap-3 mt-3 overflow-x-auto pb-2">
          {TOURS.map((t, i) => (
            <Reveal key={t.id} delay={i * 80} className="flex-shrink-0">
              <div
                onClick={() => navigate(`/passeio/${t.id}`)}
                className="rounded-xl p-3 bg-stone border border-hline cursor-pointer transition-transform active:scale-[0.98] hover:border-orange"
                style={{ width: 190 }}
              >
                <div className="h-20 rounded-lg mb-2 flex items-center justify-center bg-ink overflow-hidden">
                  {t.image ? (
                    <img src={t.image} alt={t.name} loading="lazy" className="w-full h-full object-cover" />
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
            </Reveal>
          ))}
        </div>
      </div>

      {/* DEPOIMENTOS */}
      <Testimonials />
      <div className="h-2" />

      {lightbox === "map" && (
        <PhotoModal src="/fotos/mapa-roteiro.jpg" alt="Roteiro do passeio" onClose={() => setLightbox(null)} />
      )}
      {lightbox === "explorers" && (
        <PhotoModal src="/fotos/para-exploradores.jpg" alt="Para Exploradores" onClose={() => setLightbox(null)} />
      )}
      {lightbox === "stories" && (
        <PhotoModal src="/fotos/historias-que-ficam.jpg" alt="Histórias que Ficam" onClose={() => setLightbox(null)} />
      )}
      {showHowItWorks && <HowItWorksModal onClose={() => setShowHowItWorks(false)} />}
    </div>
  );
}
