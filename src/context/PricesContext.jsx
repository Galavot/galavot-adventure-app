import React, { createContext, useContext, useEffect, useState } from "react";
import { TOURS } from "../data.js";

// Busca o preço ATUAL de cada passeio assim que o app abre. Se o admin
// mudar o preço numa promoção, o site já reflete isso na próxima vez que
// alguém abrir — sem precisar de deploy. Enquanto carrega (ou se a busca
// falhar), usa o preço padrão de data.js como fallback.
const defaults = {};
TOURS.forEach((t) => {
  defaults[t.id] = t.price;
});

const PricesContext = createContext({ prices: defaults, loading: true });

export function PricesProvider({ children }) {
  const [prices, setPrices] = useState(defaults);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/get-prices")
      .then((r) => r.json())
      .then((data) => {
        if (data?.prices) setPrices({ ...defaults, ...data.prices });
      })
      .catch(() => {
        // Se falhar, mantém os preços padrão — não trava o app.
      })
      .finally(() => setLoading(false));
  }, []);

  return <PricesContext.Provider value={{ prices, loading }}>{children}</PricesContext.Provider>;
}

export function usePrices() {
  return useContext(PricesContext);
}
