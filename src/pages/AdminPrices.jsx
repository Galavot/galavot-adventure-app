import React, { useEffect, useState, useCallback } from "react";
import { Tag, Pencil, Save, X, Car, Ban, Trash2, Plus } from "lucide-react";
import { TOURS, getUpcomingDates } from "../data.js";

const UPCOMING_DATES = getUpcomingDates(30);

function formatBlockedDate(iso) {
  const found = UPCOMING_DATES.find((d) => d.iso === iso);
  if (found) return `${found.sub} · ${found.label}`;
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export default function AdminPrices() {
  const [prices, setPrices] = useState([]);
  const [blockedDates, setBlockedDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  // Edição de vagas é independente da edição de preço — cada turno tem
  // seu próprio botão "Editar", como o Sid pediu.
  const [editingSlotsId, setEditingSlotsId] = useState(null);
  const [slotsDraft, setSlotsDraft] = useState("");
  const [savingSlots, setSavingSlots] = useState(false);
  // Formulário de novo bloqueio de data.
  const [addingBlock, setAddingBlock] = useState(false);
  const [blockTourId, setBlockTourId] = useState(TOURS[0]?.id || "");
  const [blockDate, setBlockDate] = useState(UPCOMING_DATES[0]?.iso || "");
  const [savingBlock, setSavingBlock] = useState(false);
  const [deletingBlockId, setDeletingBlockId] = useState(null);

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
      setBlockedDates(data.blockedDates || []);
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

  const startEditSlots = (p) => {
    setEditingSlotsId(p.tourId);
    setSlotsDraft(String(p.maxQuadriciclos));
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

  const handleSaveSlots = async (tourId) => {
    setSavingSlots(true);
    setError(null);
    try {
      const res = await fetch("/api/admin-prices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ tourId, maxQuadriciclos: slotsDraft }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar vagas");
      setEditingSlotsId(null);
      loadPrices();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingSlots(false);
    }
  };

  const handleAddBlock = async () => {
    setSavingBlock(true);
    setError(null);
    try {
      const res = await fetch("/api/admin-prices", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ tourId: blockTourId, date: blockDate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao bloquear data");
      setAddingBlock(false);
      loadPrices();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingBlock(false);
    }
  };

  const handleDeleteBlock = async (id) => {
    setDeletingBlockId(id);
    setError(null);
    try {
      const res = await fetch("/api/admin-prices", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao desbloquear data");
      loadPrices();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingBlockId(null);
    }
  };

  return (
    <div className="px-4 py-4 flex flex-col gap-3">
      <p className="text-[11px] text-muted -mt-1">
        Mude o preço ou o número de vagas aqui e todo o site atualiza sozinho — sem precisar mexer em código. Reservas
        já feitas mantêm o valor de quando foram feitas. Precisou tirar um quadriciclo pra manutenção? Só abaixar o
        número de vagas do turno.
      </p>

      {error && <p className="text-[#ef4444] text-sm text-center mt-2">{error}</p>}
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

          <div className="border-t border-hline mt-3 pt-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Car size={14} color="#F2600C" />
                <span className="font-display text-white text-[13px]">VAGAS POR TURNO</span>
              </div>
              {editingSlotsId !== p.tourId && (
                <button
                  onClick={() => startEditSlots(p)}
                  className="flex items-center gap-1 text-[11px] font-bold text-orange"
                >
                  <Pencil size={11} /> Editar
                </button>
              )}
            </div>

            {editingSlotsId === p.tourId ? (
              <div className="flex gap-2 mt-3">
                <div className="flex-1 flex items-center gap-1 rounded-lg px-3 py-2 bg-ink border border-hline">
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={slotsDraft}
                    onChange={(e) => setSlotsDraft(e.target.value)}
                    autoFocus
                    className="bg-transparent text-white text-[14px] outline-none w-full"
                  />
                  <span className="text-muted text-[13px]">quadriciclos</span>
                </div>
                <button
                  onClick={() => handleSaveSlots(p.tourId)}
                  disabled={savingSlots}
                  className="flex items-center gap-1.5 px-3 rounded-lg bg-orange text-ink text-[12px] font-bold"
                >
                  <Save size={12} /> Salvar
                </button>
                <button
                  onClick={() => setEditingSlotsId(null)}
                  className="flex items-center px-2 rounded-lg bg-ink border border-hline"
                >
                  <X size={14} color="#B7AFA2" />
                </button>
              </div>
            ) : (
              <div className="font-display text-orange text-2xl mt-1">
                {p.maxQuadriciclos}
                <span className="font-body text-[11px] text-muted ml-1.5">quadriciclos/turno</span>
              </div>
            )}
            {p.isDefaultSlots && <p className="text-[10px] text-muted mt-1">Padrão — nunca foi alterado. Use 0 pra fechar o turno (ex: manutenção).</p>}
          </div>
        </div>
      ))}

      <div className="rounded-xl p-4 bg-stone border border-hline">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Ban size={14} color="#F2600C" />
            <span className="font-display text-white text-[15px]">DATAS BLOQUEADAS</span>
          </div>
          {!addingBlock && (
            <button
              onClick={() => setAddingBlock(true)}
              className="flex items-center gap-1 text-[11px] font-bold text-orange"
            >
              <Plus size={12} /> Bloquear
            </button>
          )}
        </div>
        <p className="text-[10px] text-muted mt-1">
          Escolha uma data em que não quer vender esse passeio (evento, feriado, manutenção geral). Pode bloquear só
          um turno ou os dois.
        </p>

        {addingBlock && (
          <div className="flex flex-col gap-2 mt-3 rounded-lg p-3 bg-ink border border-hline">
            <select
              value={blockTourId}
              onChange={(e) => setBlockTourId(e.target.value)}
              className="bg-charcoal text-white text-[13px] rounded-lg px-3 py-2 border border-hline outline-none"
            >
              {TOURS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <select
              value={blockDate}
              onChange={(e) => setBlockDate(e.target.value)}
              className="bg-charcoal text-white text-[13px] rounded-lg px-3 py-2 border border-hline outline-none"
            >
              {UPCOMING_DATES.map((d) => (
                <option key={d.iso} value={d.iso}>
                  {d.sub} · {d.label}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={handleAddBlock}
                disabled={savingBlock}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-orange text-ink text-[12px] font-bold"
              >
                <Save size={12} /> Confirmar bloqueio
              </button>
              <button
                onClick={() => setAddingBlock(false)}
                className="flex items-center px-3 rounded-lg bg-charcoal border border-hline"
              >
                <X size={14} color="#B7AFA2" />
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2 mt-3">
          {blockedDates.length === 0 && !addingBlock && (
            <p className="text-[11px] text-muted">Nenhuma data bloqueada no momento.</p>
          )}
          {blockedDates.map((b) => (
            <div
              key={b.id}
              className="flex items-center justify-between rounded-lg px-3 py-2 bg-ink border border-hline"
            >
              <div className="text-[12px] text-cream">
                <span className="font-semibold">{formatBlockedDate(b.date)}</span>
                <span className="text-muted"> · {b.tourName}</span>
              </div>
              <button
                onClick={() => handleDeleteBlock(b.id)}
                disabled={deletingBlockId === b.id}
                aria-label="Desbloquear"
              >
                <Trash2 size={14} color="#ef4444" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
