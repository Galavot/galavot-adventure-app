import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { registerSW } from "virtual:pwa-register";
import App from "./App.jsx";
import "./index.css";

// Garante que o app instalado no celular sempre pegue a versão mais nova
// assim que ela é publicada — sem isso, o app pode continuar mostrando uma
// versão antiga em cache por bastante tempo, mesmo depois de um deploy novo.
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    // Atualiza sozinho assim que percebe uma versão nova, sem precisar
    // perguntar pro usuário.
    updateSW(true);
  },
});

// Reforça a checagem de tempos em tempos, já que apps instalados (modo
// standalone) às vezes ficam abertos por muito tempo sem recarregar.
setInterval(() => {
  updateSW();
}, 60 * 1000);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
