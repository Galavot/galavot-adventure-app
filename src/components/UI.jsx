import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Compass, Ticket, User, ChevronLeft } from "lucide-react";

export function Logo({ size = 72, className = "" }) {
  return (
    <img
      src="/logo.png"
      alt="Galavot Adventure"
      className={className}
      style={{
        width: size,
        height: size,
        objectFit: "contain",
        filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.5))",
      }}
    />
  );
}

export function TopBar({ title, showBack = false }) {
  const navigate = useNavigate();
  return (
    <div className="flex items-center gap-3 px-4 pt-5 pb-3 bg-ink sticky top-0 z-10">
      {showBack ? (
        <button onClick={() => navigate(-1)} className="text-cream" aria-label="Voltar">
          <ChevronLeft size={22} />
        </button>
      ) : (
        <div style={{ width: 22 }} />
      )}
      <div className="font-display text-white text-xl">{title}</div>
    </div>
  );
}

export function BottomNav() {
  const location = useLocation();
  const items = [
    { to: "/", icon: Home, label: "Início" },
    { to: "/passeios", icon: Compass, label: "Passeios" },
    { to: "/reservas", icon: Ticket, label: "Reservas" },
    { to: "/perfil", icon: User, label: "Perfil" },
  ];
  return (
    <div className="flex justify-around items-center py-2 bg-ink border-t border-hline sticky bottom-0">
      {items.map(({ to, icon: Icon, label }) => {
        const active = location.pathname === to;
        return (
          <Link key={to} to={to} className="flex flex-col items-center gap-1 px-2 py-1">
            <Icon size={20} color={active ? "#F2600C" : "#B7AFA2"} />
            <span className={`text-[10px] font-semibold ${active ? "text-orange" : "text-muted"}`}>{label}</span>
          </Link>
        );
      })}
    </div>
  );
}

export function TrailProgress({ step, total }) {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {Array.from({ length: total }).map((_, i) => (
        <React.Fragment key={i}>
          <div
            className="rounded-full flex-shrink-0"
            style={{ width: 9, height: 9, background: i < step ? "#F2600C" : "#3A3530" }}
          />
          {i < total - 1 && (
            <div
              className="flex-1"
              style={{
                height: 2,
                backgroundImage: `repeating-linear-gradient(90deg, ${
                  i < step - 1 ? "#F2600C" : "#3A3530"
                } 0 6px, transparent 6px 11px)`,
              }}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export function Pill({ children }) {
  return <span className="text-xs font-semibold px-2 py-1 rounded-full bg-stoneLight text-cream">{children}</span>;
}

export function PrimaryButton({ children, onClick, disabled, type = "button" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-3 rounded-lg font-display text-base tracking-wide ${
        disabled ? "bg-stoneLight text-muted" : "bg-orange text-ink"
      }`}
    >
      {children}
    </button>
  );
}
