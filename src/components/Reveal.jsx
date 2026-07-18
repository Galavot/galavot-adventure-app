import React from "react";
import { useInView } from "../hooks/useInView.js";

// Envolve qualquer conteúdo e aplica um fade + slide-up suave quando o
// elemento entra na tela durante o scroll. Uso: <Reveal delay={100}>...</Reveal>
export default function Reveal({ children, delay = 0, className = "" }) {
  const [ref, inView] = useInView();

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(16px)",
        transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}
