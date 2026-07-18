import { useEffect, useRef, useState } from "react";

// Hook leve pra detectar quando um elemento entra na tela, usado pra
// disparar animações de fade/slide durante o scroll sem precisar de
// nenhuma biblioteca externa (menos peso, melhor performance).
export function useInView(options = { threshold: 0.15, triggerOnce: true }) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Evita quebrar em navegadores muito antigos sem suporte
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (options.triggerOnce) observer.unobserve(node);
        } else if (!options.triggerOnce) {
          setInView(false);
        }
      },
      { threshold: options.threshold }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [options.threshold, options.triggerOnce]);

  return [ref, inView];
}
