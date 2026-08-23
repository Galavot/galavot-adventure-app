import React, { useEffect, useState, useCallback } from "react";
import { UserPlus, Power, Sun, Moon } from "lucide-react";
import { PrimaryButton } from "../components/UI.jsx";

export default function AdminGuides() {
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nome: "", whatsapp: "", recebeMatinal: true, recebeVespertino: true });

  const getToken = () => sessionStorage.getItem("galavot_admin_token");

  const loadGuides = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin-guides", {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao carregar guias");
      setGuides(data.guides || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGuides();
  }, [loadGuides]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin-guides", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao cadastrar guia");
      setForm({ nome: "", whatsapp: "", recebeMatinal: true, recebeVespertino: true });
      setShowForm(false);
      loadGuides();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const patchGuide = async (id, updates) => {
    try {
      await fetch("/api/admin-guides", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ id, ...updates }),
      });
      loadGuides();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="px-4 py-4 flex flex-col gap-3">
      <button
        onClick={() => setShowForm((v) => !v)}
        className="flex items-center justify-center gap-2 rounded-lg py-3 bg-stone border border-hline"
      >
        <UserPlus size={16} color="#F2600C" />
        <span className="text-[13px] font-semibold text-cream">{showForm ? "Cancelar" : "+ Novo Guia"}</span>
      </button>

      {showForm && (
        <form onSubmit={handleCreate} className="rounded-xl p-4 bg-stone border border-hline flex flex-col gap-2">
          <input
            required
            placeholder="Nome do guia"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            className="rounded-lg px-3 py-2 bg-ink border border-hline text-white text-[13px] placeholder:text-muted outline-none"
          />
          <input
            required
            placeholder="WhatsApp (ex: 5527999927056)"
            value={form.whatsapp}
            onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
            className="rounded-lg px-3 py-2 bg-ink border border-hline text-white text-[13px] placeholder:text-muted outline-none"
          />
          <div className="flex gap-2 mt-1">
            <label className="flex-1 flex items-center gap-2 rounded-lg px-3 py-2 bg-ink border border-hline">
              <input
                type="checkbox"
                checked={form.recebeMatinal}
                onChange={(e) => setForm({ ...form, recebeMatinal: e.target.checked })}
                className="accent-orange"
              />
              <span className="text-[12px] text-cream">Manhã</span>
            </label>
            <label className="flex-1 flex items-center gap-2 rounded-lg px-3 py-2 bg-ink border border-hline">
              <input
                type="checkbox"
                checked={form.recebeVespertino}
                onChange={(e) => setForm({ ...form, recebeVespertino: e.target.checked })}
                className="accent-orange"
              />
              <span className="text-[12px] text-cream">Tarde</span>
            </label>
          </div>
          <div className="mt-1">
            <PrimaryButton type="submit" disabled={saving}>
              {saving ? "SALVANDO..." : "CADASTRAR GUIA"}
            </PrimaryButton>
          </div>
        </form>
      )}

      {error && <p className="text-[#ef4444] text-sm text-center mt-2">{error}</p>}
      {loading && <p className="text-muted text-sm text-center mt-8">Carregando...</p>}
      {!loading && guides.length === 0 && (
        <p className="text-muted text-sm text-center mt-8">Nenhum guia cadastrado ainda.</p>
      )}

      {guides.map((g) => (
        <div key={g.id} className="rounded-xl p-4 bg-stone border border-hline">
          <div className="flex justify-between items-start">
            <div>
              <div className="font-display text-white text-base">{g.nome}</div>
              <div className="text-[11px] text-muted mt-0.5">{g.whatsapp}</div>
            </div>
            <button onClick={() => patchGuide(g.id, { ativo: !g.ativo })} aria-label="Ativar/desativar">
              <Power size={16} color={g.ativo ? "#22c55e" : "#B7AFA2"} />
            </button>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => patchGuide(g.id, { recebeMatinal: !g.recebe_matinal })}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-semibold border ${
                g.recebe_matinal ? "bg-orange text-ink border-orange" : "bg-ink text-muted border-hline"
              }`}
            >
              <Sun size={12} /> Manhã
            </button>
            <button
              onClick={() => patchGuide(g.id, { recebeVespertino: !g.recebe_vespertino })}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-semibold border ${
                g.recebe_vespertino ? "bg-orange text-ink border-orange" : "bg-ink text-muted border-hline"
              }`}
            >
              <Moon size={12} /> Tarde
            </button>
          </div>
          {!g.ativo && <div className="text-[10px] text-muted mt-2">Guia desativado — não recebe listas</div>}
        </div>
      ))}
    </div>
  );
}
