import React, { createContext, useContext } from "react";
import { usePWAInstall } from "../hooks/usePWAInstall.js";

// O evento "beforeinstallprompt" do navegador dispara cedo, logo depois do
// app carregar — e só dispara UMA vez por sessão. Se o hook usePWAInstall()
// só for chamado dentro da página de Perfil, o listener só é registrado
// quando o usuário navega até lá, e nessa hora o evento já passou e foi
// perdido pra sempre. Por isso o Provider fica no topo do app (App.jsx),
// registrando o listener desde o primeiro instante, e a página de Perfil
// só consome o resultado via contexto.
const PWAInstallContext = createContext(null);

export function PWAInstallProvider({ children }) {
  const value = usePWAInstall();
  return <PWAInstallContext.Provider value={value}>{children}</PWAInstallContext.Provider>;
}

export function usePWAInstallContext() {
  return useContext(PWAInstallContext);
}
