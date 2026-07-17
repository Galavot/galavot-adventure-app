import React from "react";
import { Phone, Instagram } from "lucide-react";
import { TopBar, Logo } from "../components/UI.jsx";
import { CONTACT } from "../data.js";

export default function Profile() {
  return (
    <div className="flex-1 overflow-y-auto bg-charcoal">
      <TopBar title="PERFIL" />
      <div className="flex flex-col items-center px-4 pt-4">
        <Logo size={80} />
        <div className="font-display text-white text-lg mt-3">GALAVOT ADVENTURE</div>
        <div className="text-xs text-muted">{CONTACT.city}</div>

        <div className="w-full flex flex-col gap-2 mt-6">
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
            href={CONTACT.instagramUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-lg px-4 py-3 bg-stone border border-hline"
          >
            <Instagram size={16} color="#F2600C" />
            <span className="text-[13px] text-cream">{CONTACT.instagram}</span>
          </a>
        </div>
      </div>
    </div>
  );
}
