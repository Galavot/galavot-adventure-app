import { useEffect, useState } from "react";

// Detecta se o app já está rodando "instalado" (modo standalone)
function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

function isIOS() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

// Hook que expõe:
// - canInstall: true quando dá pra mostrar o botão de instalar
// - isInstalled: true se o app já está instalado
// - platform: 'android' | 'ios' | 'other'
// - promptInstall(): dispara o prompt nativo (Android/Chrome) ou sinaliza
//   que deve mostrar instruções manuais (iOS)
export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(isStandalone());

  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    const handleInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const platform = isIOS() ? "ios" : deferredPrompt ? "android" : "other";
  const canInstall = !installed && (isIOS() || !!deferredPrompt);

  const promptInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") setInstalled(true);
      setDeferredPrompt(null);
      return "native";
    }
    // iOS ou navegador sem suporte ao prompt nativo — quem chama deve
    // mostrar as instruções manuais.
    return "manual";
  };

  return { canInstall, isInstalled: installed, platform, promptInstall };
}
