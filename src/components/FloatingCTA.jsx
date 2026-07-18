import React from "react";
import { useNavigate } from "react-router-dom";
import { CalendarPlus } from "lucide-react";

export default function FloatingCTA({ aboveNav = true }) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate("/passeios")}
      aria-label="Reservar Agora"
      className="fixed z-40 flex items-center gap-2 px-4 py-3 rounded-full shadow-lg bg-orange text-ink font-display text-sm tracking-wide"
      style={{
        right: 16,
        bottom: aboveNav ? 76 : 20,
        boxShadow: "0 8px 24px rgba(242,96,12,0.45)",
      }}
    >
      <CalendarPlus size={16} />
      RESERVAR AGORA
    </button>
  );
}
