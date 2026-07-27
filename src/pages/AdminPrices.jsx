import React, { useEffect, useState, useCallback } from "react";
import { Tag, Pencil, Save, X } from "lucide-react";

export default function AdminPrices() {
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  const getToken = () => sessionStorage.getItem("galavot_admin_token");

  const loadPrices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin-prices", {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao carregar preços");
      setPrices(data.prices || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPrices();
  }, [loadPrices]);

  const startEdit = (p) => {
    setEditingId(p.tourId);
    setDraft(String(p.price));
  };

  const handleSave = async (tourId) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin-prices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ tourId, price: draft }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar preço");
      setEditingId(null);
      loadPrices();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-4 py-4 flex flex-col gap-3">
      <p className="text-[11px] text-muted -mt-1">
        Mude o preço aqui e todo o site atualiza sozinho — sem precisar mexer em código. Reservas já feitas mantêm o
        valor de quando foram feitas.
      </p>

      {error && <p className="text-orange text-sm text-center mt-2">{error}</p>}
      {loading && <p className="text-muted text-sm text-center mt-8">Carregando...</p>}

      {prices.map((p) => (
        <div key={p.tourId} className="rounded-xl p-4 bg-stone border border-hline">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Tag size={14} color="#F2600C" />
              <span className="font-display text-white text-[15px]">{p.tourName}</span>
            </div>
            {editingId !== p.tourId && (
              <button
                onClick={() => startEdit(p)}
                className="flex items-center gap-1 text-[11px] font-bold text-orange"
              >
                <Pencil size={11} /> Editar
              </button>
            )}
          </div>

          {editingId === p.tourId ? (
            <div className="flex gap-2 mt-3">
              <div className="flex-1 flex items-center gap-1 rounded-lg px-3 py-2 bg-ink border border-hline">
                <span className="text-muted text-[13px]">R$</span>
                <input
                  type="number"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  autoFocus
                  className="bg-transparent text-white text-[14px] outline-none w-full"
                />
              </div>
              <button
                onClick={() => handleSave(p.tourId)}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 rounded-lg bg-orange text-ink text-[12px] font-bold"
              >
                <Save size={12} /> Salvar
              </button>
              <button
                onClick={() => setEditingId(null)}
                className="flex items-center px-2 rounded-lg bg-ink border border-hline"
              >
                <X size={14} color="#B7AFA2" />
              </button>
            </div>
          ) : (
            <div className="font-display text-orange text-2xl mt-1">
              R$ {p.price}
              <span className="font-body text-[11px] text-muted ml-1.5">/quadriciclo</span>
            </div>
          )}
          {p.isDefault && <p className="text-[10px] text-muted mt-1">Preço padrão — nunca foi alterado.</p>}
        </div>
      ))}
    </div>
  );
}
