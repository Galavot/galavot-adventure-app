import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Instagram,
  Facebook,
  Youtube,
  Music2,
  Video,
  Phone,
  Mail,
  CalendarCheck,
  MapPin,
} from "lucide-react";
import { Logo } from "../components/UI.jsx";
import { CONTACT, SECONDARY_CONTACT } from "../data.js";

const LINKS = [
  {
    label: "Reservar Passeio",
    sub: "Reserve e pague pelo app",
    icon: CalendarCheck,
    isInternal: true,
    to: "/passeios",
    highlight: true,
  },
  {
    label: "WhatsApp — Jorge Galavot",
    sub: CONTACT.phone,
    icon: Phone,
    href: `https://wa.me/${CONTACT.whatsapp}`,
  },
  {
    label: "WhatsApp — Sidnei Pereira",
    sub: SECONDARY_CONTACT.phone,
    icon: Phone,
    href: `https://wa.me/${SECONDARY_CONTACT.whatsapp}`,
  },
  {
    label: "Instagram",
    sub: CONTACT.instagram,
    icon: Instagram,
    href: CONTACT.instagramUrl,
  },
  {
    label: "TikTok",
    sub: CONTACT.instagram,
    icon: Music2,
    href: CONTACT.tiktokUrl,
  },
  {
    label: "YouTube",
    sub: "@galavotadventure.oficial",
    icon: Youtube,
    href: CONTACT.youtubeUrl,
  },
  {
    label: "Facebook",
    sub: "Galavot Adventure",
    icon: Facebook,
    href: CONTACT.facebookUrl,
  },
  {
    label: "Kwai",
    sub: CONTACT.instagram,
    icon: Video,
    href: CONTACT.kwaiUrl,
  },
  {
    label: "E-mail",
    sub: CONTACT.email,
    icon: Mail,
    href: `mailto:${CONTACT.email}`,
  },
];

export default function LinkHub() {
  const navigate = useNavigate();

  return (
    <div
      className="flex-1 overflow-y-auto flex flex-col items-center px-6 pt-10 pb-10"
      style={{
        background:
          "radial-gradient(circle at 50% 0%, #2C2823 0%, #151311 60%)",
      }}
    >
      <Logo size={92} />
      <div className="font-display text-white text-2xl mt-4 text-center">GALAVOT ADVENTURE</div>
      <div className="flex items-center gap-1.5 mt-1">
        <MapPin size={12} color="#B7AFA2" />
        <span className="text-[12px] text-muted">{CONTACT.city}</span>
      </div>
      <div className="text-[12px] text-cream text-center mt-3 max-w-[260px] leading-relaxed">
        Aventura • Natureza • Liberdade
        <br />
        Passeios guiados de quadriciclo off-road
      </div>

      <div className="w-full flex flex-col gap-3 mt-8 max-w-[360px]">
        {LINKS.map((link, i) => {
          const Icon = link.icon;
          const content = (
            <div
              className={`flex items-center gap-3 rounded-xl px-4 py-3.5 border transition-transform active:scale-[0.98] ${
                link.highlight ? "bg-orange border-orange" : "bg-stone border-hline"
              }`}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: link.highlight ? "rgba(21,19,17,0.15)" : "#151311" }}
              >
                <Icon size={17} color={link.highlight ? "#151311" : "#F2600C"} />
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className={`font-display text-[15px] ${link.highlight ? "text-ink" : "text-white"}`}>
                  {link.label}
                </div>
                <div className={`text-[11px] truncate ${link.highlight ? "text-ink/70" : "text-muted"}`}>
                  {link.sub}
                </div>
              </div>
            </div>
          );

          if (link.isInternal) {
            return (
              <button key={i} onClick={() => navigate(link.to)} aria-label={link.label}>
                {content}
              </button>
            );
          }

          return (
            <a key={i} href={link.href} target="_blank" rel="noreferrer" aria-label={link.label}>
              {content}
            </a>
          );
        })}
      </div>

      <div className="text-[10px] text-muted mt-10 text-center">
        © {new Date().getFullYear()} Galavot Adventure · Guarapari - ES
      </div>
    </div>
  );
}
