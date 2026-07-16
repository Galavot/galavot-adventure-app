import React from "react";
import { useNavigate } from "react-router-dom";
import { Users, Mountain, ShieldCheck, Camera, Clock } from "lucide-react";
import { Logo, PrimaryButton } from "../components/UI.jsx";
import { TOURS } from "../data.js";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="flex-1 overflow-y-auto bg-charcoal">
      <div className="px-5 pt-6 pb-8 relative overflow-hidden bg-gradient-to-br from-ink via-ink to-stone">
        <div
          className="absolute top-0 right-[-40px] opacity-90"
          style={{ width: 140, height: 260, background: "#F2600C", transform: "rotate(18deg)" }}
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
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 px-5 mt-5">
        {[
          { icon: Users, label: "Aventura para Todos" },
          { icon: Mountain, label: "Cenários Incríveis" },
          { icon: ShieldCheck, label: "Diversão Garantida" },
          { icon: Camera, label: "Momentos Inesquecíveis" },
        ].map(({ icon: Icon, label }, i) => (
          <div key={i} className="rounded-xl p-3 flex flex-col items-center text-center gap-2 bg-stone border border-hline">
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
    </div>
  );
}
