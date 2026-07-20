import React from "react";
import { X } from "lucide-react";

// Mapa estilizado (não geográfico) da Rota 04, com as paradas numeradas
// conectadas por uma trilha pontilhada — complementa a timeline de texto
// já existente em TourDetail, dando uma visão espacial do roteiro.
const POINTS = [
  { x: 40, y: 200 },
  { x: 80, y: 165 },
  { x: 135, y: 145 },
  { x: 185, y: 100 },
  { x: 225, y: 130 },
  { x: 260, y: 85 },
  { x: 215, y: 45 },
  { x: 145, y: 30 },
];

export default function RouteMapModal({ stops, onClose }) {
  const pathD = POINTS.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/95"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Mapa da rota"
    >
      <div
        className="flex items-center justify-between px-4 py-3 bg-charcoal border-b border-hline shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="font-display text-white text-[17px] tracking-wide">MAPA DA ROTA</span>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full flex items-center justify-center bg-stone border border-hline"
          aria-label="Fechar"
        >
          <X size={18} color="#fff" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4" onClick={(e) => e.stopPropagation()}>
        <div className="rounded-xl p-3 bg-stone border border-hline">
          <svg viewBox="0 0 300 240" className="w-full" style={{ height: 200 }}>
            <path d={pathD} fill="none" stroke="#F2600C" strokeWidth="2.5" strokeDasharray="6 6" strokeLinecap="round" />
            {POINTS.map((p, i) => (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r={10} fill="#151311" stroke="#F2600C" strokeWidth="2" />
                <text x={p.x} y={p.y + 3.5} textAnchor="middle" fontSize="9" fill="#F5F0E6" fontWeight="700">
                  {i + 1}
                </text>
              </g>
            ))}
          </svg>
        </div>

        <div className="flex flex-col gap-2.5 mt-4">
          {stops.map((s, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center bg-stoneLight border border-hline text-orange text-[10px] font-bold flex-shrink-0 mt-0.5">
                {i + 1}
              </div>
              <div>
                <div className="text-[13px] font-semibold text-cream">{s.title}</div>
                <div className="text-[11px] text-muted leading-relaxed mt-0.5">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
