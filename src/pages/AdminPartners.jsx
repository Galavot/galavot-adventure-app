import React, { useEffect, useState, useCallback } from "react";
import { UserPlus, Wallet, Power, Trash2, Pencil, Check, X, CalendarCheck2 } from "lucide-react";
import { PrimaryButton } from "../components/UI.jsx";

// "AAAA-MM-DD" de hoje, sempre no horário local (nunca toISOString() —
// ela vira UTC e adianta o dia à noite).
function todayISO() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function formatDateBR(iso) {
  if (!iso) return "";
  const [year, month, day] = iso.split("-");
  if (!year || !month || !day) return iso;
  return `${day}/${month}/${year}`;
}

export default function AdminPartners({ bookings }) {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [form, setForm] = useState({ nome: "", empresa: "", codigo: "", senha: "", comissaoPercentual: 10, whatsapp: "" });
  // id do parceiro cujo WhatsApp está sendo editado agora, e o valor
  // digitado nesse campo — só um por vez, guardado fora da lista de
  // parceiros pra não precisar mexer no objeto inteiro a cada tecla.
  const [editingWhatsappId, setEditingWhatsappId] = useState(null);
  const [whatsappDraft, setWhatsappDraft] = useState("");
  const [savingWhatsapp, setSavingWhatsapp] = useState(false);
  // Janela de acerto de comissão: qual parceiro está com a janela
  // aberta, quais reservas estão marcadas pra pagar agora, e o estado de
  // "enviando".
  const [settleModalPartnerId, setSettleModalPartnerId] = useState(null);
  const [selectedBookingIds, setSelectedBookingIds] = useState(new Set());
  const [settling, setSettling] = useState(false);
  const [settleError, setSettleError] = useState(null);

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
    // Mesma regra do painel do parceiro: só conta reserva realmente paga.
    const PAGO_DE_VERDADE = ["confirmado", "concluido"];
    const partnerBookings = bookings.filter((b) => b.partner_id === partnerId && PAGO_DE_VERDADE.includes(b.status));
    const pendente = partnerBookings
      .filter((b) => !b.comissao_paga)
      .reduce((sum, b) => sum + Number(b.comissao_valor || 0), 0);
    const total = partnerBookings.reduce((sum, b) => sum + Number(b.comissao_valor || 0), 0);
    return { pendente, total, reservas: partnerBookings.length };
  };

  // Reservas dessa parceria que ainda não tiveram a comissão paga —
  // usado pra montar a lista de checkboxes na janela de acerto.
  const pendingBookingsFor = (partnerId) => {
    const PAGO_DE_VERDADE = ["confirmado", "concluido"];
    return bookings
      .filter((b) => b.partner_id === partnerId && PAGO_DE_VERDADE.includes(b.status) && !b.comissao_paga)
      .sort((a, b) => (a.booking_date || "").localeCompare(b.booking_date || ""));
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

  const startEditWhatsapp = (partner) => {
    setEditingWhatsappId(partner.id);
    setWhatsappDraft(partner.whatsapp || "");
  };

  const cancelEditWhatsapp = () => {
    setEditingWhatsappId(null);
    setWhatsappDraft("");
  };

  const saveWhatsapp = async (partnerId) => {
    setSavingWhatsapp(true);
    setError(null);
    try {
      const res = await fetch("/api/admin-partners", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ id: partnerId, whatsapp: whatsappDraft }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar WhatsApp");
      setEditingWhatsappId(null);
      setWhatsappDraft("");
      loadPartners();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingWhatsapp(false);
    }
  };

  const openSettleModal = (partnerId) => {
    const pending = pendingBookingsFor(partnerId);
    // Já vem pré-marcado o que já aconteceu (data do passeio no passado)
    // — é o critério que você usa no acerto de toda segunda. Os passeios
    // futuros ficam desmarcados, mas dá pra marcar também se quiser.
    const hoje = todayISO();
    const preSelected = new Set(pending.filter((b) => b.booking_date && b.booking_date < hoje).map((b) => b.id));
    setSelectedBookingIds(preSelected);
    setSettleError(null);
    setSettleModalPartnerId(partnerId);
  };

  const closeSettleModal = () => {
    setSettleModalPartnerId(null);
    setSelectedBookingIds(new Set());
    setSettleError(null);
  };

  const toggleBookingSelected = (bookingId) => {
    setSelectedBookingIds((prev) => {
      const next = new Set(prev);
      if (next.has(bookingId)) next.delete(bookingId);
      else next.add(bookingId);
      return next;
    });
  };

  const selectAllPending = (partnerId) => {
    setSelectedBookingIds(new Set(pendingBookingsFor(partnerId).map((b) => b.id)));
  };

  const selectOnlyPast = (partnerId) => {
    const hoje = todayISO();
    setSelectedBookingIds(
      new Set(pendingBookingsFor(partnerId).filter((b) => b.booking_date && b.booking_date < hoje).map((b) => b.id))
    );
  };

  const clearSelection = () => setSelectedBookingIds(new Set());

  const confirmSettle = async () => {
    if (selectedBookingIds.size === 0) {
      setSettleError("Selecione pelo menos uma reserva.");
      return;
    }
    setSettling(true);
    setSettleError(null);
    try {
      const res = await fetch("/api/admin-mark-commission-paid", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ partnerId: settleModalPartnerId, bookingIds: Array.from(selectedBookingIds) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao registrar o pagamento");
      window.location.reload();
    } catch (err) {
      setSettleError(err.message);
      setSettling(false);
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
                {editingWhatsappId === p.id ? (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <input
                      autoFocus
                      type="tel"
                      value={whatsappDraft}
                      onChange={(e) => setWhatsappDraft(e.target.value)}
                      placeholder="(27) 9 9999-9999"
                      className="rounded-lg px-2 py-1 bg-ink border border-hline text-white text-[11px] placeholder:text-muted outline-none w-[140px]"
                    />
                    <button
                      onClick={() => saveWhatsapp(p.id)}
                      disabled={savingWhatsapp}
                      aria-label="Salvar WhatsApp"
                      className="w-6 h-6 flex items-center justify-center rounded-md bg-moss"
                    >
                      <Check size={12} color="#fff" />
                    </button>
                    <button
                      onClick={cancelEditWhatsapp}
                      aria-label="Cancelar edição"
                      className="w-6 h-6 flex items-center justify-center rounded-md bg-ink border border-hline"
                    >
                      <X size={12} color="#B7AFA2" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => startEditWhatsapp(p)}
                    className="flex items-center gap-1 mt-0.5"
                  >
                    <span className="text-[11px] text-muted">
                      {p.whatsapp ? `zap: ${p.whatsapp}` : "zap: não cadastrado"}
                    </span>
                    <Pencil size={10} color="#B7AFA2" />
                  </button>
                )}
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
                  onClick={() => openSettleModal(p.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-ink text-cream border border-hline"
                >
                  <CalendarCheck2 size={12} />
                  Acertar comissão
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

      {settleModalPartnerId && (
        <SettleCommissionModal
          partner={partners.find((p) => p.id === settleModalPartnerId)}
          pendingBookings={pendingBookingsFor(settleModalPartnerId)}
          selectedBookingIds={selectedBookingIds}
          onToggle={toggleBookingSelected}
          onSelectAll={() => selectAllPending(settleModalPartnerId)}
          onSelectOnlyPast={() => selectOnlyPast(settleModalPartnerId)}
          onClearSelection={clearSelection}
          onConfirm={confirmSettle}
          onClose={closeSettleModal}
          settling={settling}
          error={settleError}
        />
      )}
    </div>
  );
}

function SettleCommissionModal({
  partner,
  pendingBookings,
  selectedBookingIds,
  onToggle,
  onSelectAll,
  onSelectOnlyPast,
  onClearSelection,
  onConfirm,
  onClose,
  settling,
  error,
}) {
  const hoje = todayISO();
  const selectedTotal = pendingBookings
    .filter((b) => selectedBookingIds.has(b.id))
    .reduce((sum, b) => sum + Number(b.comissao_valor || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70" onClick={onClose}>
      <div
        className="w-full max-w-md max-h-[85vh] rounded-t-2xl bg-charcoal border-t border-hline flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 pt-4 pb-3 border-b border-hline flex items-center justify-between">
          <div>
            <div className="font-display text-white text-base">Acertar comissão</div>
            <div className="text-[11px] text-muted mt-0.5">{partner?.nome}</div>
          </div>
          <button onClick={onClose} aria-label="Fechar" className="w-7 h-7 flex items-center justify-center rounded-full bg-stone">
            <X size={14} color="#B7AFA2" />
          </button>
        </div>

        <div className="flex gap-2 px-4 pt-3">
          <button
            onClick={onSelectOnlyPast}
            className="px-2.5 py-1.5 rounded-lg text-[10px] font-semibold bg-stone text-cream border border-hline"
          >
            Só as já realizadas
          </button>
          <button
            onClick={onSelectAll}
            className="px-2.5 py-1.5 rounded-lg text-[10px] font-semibold bg-stone text-cream border border-hline"
          >
            Selecionar tudo
          </button>
          <button
            onClick={onClearSelection}
            className="px-2.5 py-1.5 rounded-lg text-[10px] font-semibold bg-stone text-cream border border-hline"
          >
            Limpar
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
          {pendingBookings.length === 0 && (
            <p className="text-muted text-[12px] text-center py-4">Nenhuma comissão pendente.</p>
          )}
          {pendingBookings.map((b) => {
            const jaAconteceu = b.booking_date && b.booking_date < hoje;
            const checked = selectedBookingIds.has(b.id);
            return (
              <label
                key={b.id}
                className={`flex items-start gap-2.5 rounded-lg px-3 py-2.5 border ${
                  checked ? "bg-stone border-orange" : "bg-ink border-hline"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(b.id)}
                  className="mt-0.5 w-4 h-4 accent-orange flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[12px] text-cream font-medium">{b.tour_name}</span>
                    <span
                      className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
                        jaAconteceu ? "bg-moss text-white" : "bg-hline text-muted"
                      }`}
                    >
                      {jaAconteceu ? "JÁ REALIZADO" : "AINDA NÃO ACONTECEU"}
                    </span>
                  </div>
                  <div className="text-[10px] text-muted mt-0.5">
                    {formatDateBR(b.booking_date)} · {b.customer_name} · {b.booking_code}
                  </div>
                </div>
                <span className="text-[12px] font-semibold text-orange flex-shrink-0">
                  R$ {Number(b.comissao_valor || 0).toFixed(2)}
                </span>
              </label>
            );
          })}
        </div>

        <div className="px-4 py-3 border-t border-hline">
          {error && <p className="text-[11px] text-[#ef4444] mb-2">{error}</p>}
          <div className="flex items-center justify-between mb-3">
            <span className="text-[12px] text-muted">{selectedBookingIds.size} selecionada(s)</span>
            <span className="text-[14px] font-semibold text-cream">Total: R$ {selectedTotal.toFixed(2)}</span>
          </div>
          <PrimaryButton onClick={onConfirm} disabled={settling || selectedBookingIds.size === 0}>
            {settling ? "REGISTRANDO..." : "CONFIRMAR PAGAMENTO"}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
