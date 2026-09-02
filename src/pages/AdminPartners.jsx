import React, { useEffect, useState, useCallback } from "react";
import { UserPlus, Wallet, Power, Trash2 } from "lucide-react";
import { PrimaryButton } from "../components/UI.jsx";

export default function AdminPartners({ bookings }) {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [form, setForm] = useState({ nome: "", empresa: "", codigo: "", senha: "", comissaoPercentual: 10, whatsapp: "" });

  const getToken = () => sessionStorage.getItem("galavot_admin_token");

  const loadPartners = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin-partners", {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao carregar parceiros");
      setPartners(data.partners || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPartners();
  }, [loadPartners]);

  const commissionFor = (partnerId) => {
    const partnerBookings = bookings.filter((b) => b.partner_id === partnerId && b.status !== "cancelado");
    const pendente = partnerBookings
      .filter((b) => !b.comissao_paga)
      .reduce((sum, b) => sum + Number(b.comissao_valor || 0), 0);
    const total = partnerBookings.reduce((sum, b) => sum + Number(b.comissao_valor || 0), 0);
    return { pendente, total, reservas: partnerBookings.length };
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin-partners", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao criar parceiro");
      setForm({ nome: "", empresa: "", codigo: "", senha: "", comissaoPercentual: 10, whatsapp: "" });
      setShowForm(false);
      loadPartners();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleAtivo = async (partner) => {
    try {
      await fetch("/api/admin-partners", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ id: partner.id, ativo: !partner.ativo }),
      });
      loadPartners();
    } catch (err) {
      setError(err.message);
    }
  };

  const markPaid = async (partnerId) => {
    try {
      await fetch("/api/admin-mark-commission-paid", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ partnerId }),
      });
      window.location.reload();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (partnerId) => {
    if (confirmDeleteId !== partnerId) {
      setConfirmDeleteId(partnerId);
      return;
    }
    setError(null);
    try {
      const res = await fetch("/api/admin-partners", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ id: partnerId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao excluir parceiro");
      setConfirmDeleteId(null);
      loadPartners();
    } catch (err) {
      setError(err.message);
      setConfirmDeleteId(null);
    }
  };

  return (
    <div className="px-4 py-4 flex flex-col gap-3">
      <button
        onClick={() => setShowForm((v) => !v)}
        className="flex items-center justify-center gap-2 rounded-lg py-3 bg-stone border border-hline"
      >
        <UserPlus size={16} color="#F2600C" />
        <span className="text-[13px] font-semibold text-cream">
          {showForm ? "Cancelar" : "+ Novo Parceiro"}
        </span>
      </button>

      {showForm && (
        <form onSubmit={handleCreate} className="rounded-xl p-4 bg-stone border border-hline flex flex-col gap-2">
          <input
            required
            placeholder="Nome do parceiro"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            className="rounded-lg px-3 py-2 bg-ink border border-hline text-white text-[13px] placeholder:text-muted outline-none"
          />
          <input
            placeholder="Empresa (opcional)"
            value={form.empresa}
            onChange={(e) => setForm({ ...form, empresa: e.target.value })}
            className="rounded-lg px-3 py-2 bg-ink border border-hline text-white text-[13px] placeholder:text-muted outline-none"
          />
          <input
            required
            type="tel"
            placeholder="WhatsApp fixo do parceiro (27) 9 9999-9999"
            value={form.whatsapp}
            onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
            className="rounded-lg px-3 py-2 bg-ink border border-hline text-white text-[13px] placeholder:text-muted outline-none"
          />
          <p className="text-[10px] text-muted -mt-1">
            Usado como contato padrão quando o parceiro reservar sem ter o WhatsApp do cliente na hora.
          </p>
          <input
            required
            placeholder="Código de acesso (ex: HOTEL01)"
            value={form.codigo}
            onChange={(e) => setForm({ ...form, codigo: e.target.value })}
            className="rounded-lg px-3 py-2 bg-ink border border-hline text-white text-[13px] placeholder:text-muted outline-none"
          />
          <input
            required
            type="password"
            placeholder="Senha"
            value={form.senha}
            onChange={(e) => setForm({ ...form, senha: e.target.value })}
            className="rounded-lg px-3 py-2 bg-ink border border-hline text-white text-[13px] placeholder:text-muted outline-none"
          />
          <input
            type="number"
            placeholder="Comissão %"
            value={form.comissaoPercentual}
            onChange={(e) => setForm({ ...form, comissaoPercentual: Number(e.target.value) })}
            className="rounded-lg px-3 py-2 bg-ink border border-hline text-white text-[13px] placeholder:text-muted outline-none"
          />
          <div className="mt-1">
            <PrimaryButton type="submit" disabled={saving}>
              {saving ? "SALVANDO..." : "CRIAR PARCEIRO"}
            </PrimaryButton>
          </div>
        </form>
      )}

      {error && <p className="text-[#ef4444] text-sm text-center mt-2">{error}</p>}
      {loading && <p className="text-muted text-sm text-center mt-4">Carregando...</p>}
      {!loading && partners.length === 0 && (
        <p className="text-muted text-sm text-center mt-4">Nenhum parceiro cadastrado ainda.</p>
      )}

      {partners.map((p) => {
        const { pendente, total, reservas } = commissionFor(p.id);
        return (
          <div key={p.id} className="rounded-xl p-4 bg-stone border border-hline">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-display text-white text-base">{p.nome}</div>
                <div className="text-[11px] text-muted mt-0.5">
                  {p.empresa ? `${p.empresa} · ` : ""}código: {p.codigo}
                </div>
                {p.whatsapp && <div className="text-[11px] text-muted mt-0.5">zap: {p.whatsapp}</div>}
              </div>
              <button
                onClick={() => toggleAtivo(p)}
                aria-label={p.ativo ? "Desativar parceiro" : "Ativar parceiro"}
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold ${
                  p.ativo ? "bg-moss text-white" : "bg-ink text-muted"
                }`}
              >
                <Power size={11} />
                {p.ativo ? "ATIVO" : "INATIVO"}
              </button>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-[11px] text-muted">{reservas} reserva(s)</span>
              <span className="text-[11px] text-muted">{p.comissao_percentual}% de comissão</span>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-hline">
              <div className="flex items-center gap-1.5">
                <Wallet size={13} color="#F2600C" />
                <span className="text-[12px] text-cream">
                  Pendente: <span className="font-semibold text-orange">R$ {pendente.toFixed(2)}</span>
                </span>
              </div>
              {pendente > 0 && (
                <button
                  onClick={() => markPaid(p.id)}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-ink text-cream border border-hline"
                >
                  Marcar como pago
                </button>
              )}
            </div>
            <button
              onClick={() => handleDelete(p.id)}
              className={`w-full flex items-center justify-center gap-1.5 mt-3 py-2 rounded-lg text-[11px] font-semibold border ${
                confirmDeleteId === p.id
                  ? "bg-orange text-ink border-orange"
                  : "bg-ink text-muted border-hline"
              }`}
            >
              <Trash2 size={12} />
              {confirmDeleteId === p.id ? "Toque de novo pra confirmar exclusão" : "Excluir parceiro"}
            </button>
          </div>
        );
      })}
    </div>
  );
}
