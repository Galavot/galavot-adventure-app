import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FileText, ShieldCheck, Check } from "lucide-react";
import { TopBar, TrailProgress, PrimaryButton } from "../components/UI.jsx";
import DocumentModal from "../components/DocumentModal.jsx";
import { useBooking } from "../context/BookingContext.jsx";

// Validação de CPF de verdade (dígitos verificadores), não só contagem de
// caracteres — evita reserva travar lá na frente, na hora de pagar, por
// um CPF digitado errado.
function isValidCpf(raw) {
  const cpf = (raw || "").replace(/\D/g, "");
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  const calcDigit = (base) => {
    let sum = 0;
    for (let i = 0; i < base.length; i++) sum += Number(cpf[i]) * (base - i);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  return calcDigit(10) === Number(cpf[9]) && calcDigit(11) === Number(cpf[10]);
}

function formatCpf(raw) {
  const d = (raw || "").replace(/\D/g, "").slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export default function BookingCustomer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { customer, setCustomer } = useBooking();
  const [touched, setTouched] = useState(false);
  const [openDoc, setOpenDoc] = useState(null); // 'manual' | 'termo' | null
  const [viewedManual, setViewedManual] = useState(false);
  const [viewedTermo, setViewedTermo] = useState(false);

  const nameValid = customer.name.trim().length >= 3;
  const phoneValid = customer.phone.replace(/\D/g, "").length >= 10;
  const emailValid = customer.email.trim() === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email.trim());
  const cpfValid = isValidCpf(customer.cpf);
  const docsViewed = viewedManual && viewedTermo;
  const canContinue = nameValid && phoneValid && emailValid && cpfValid && customer.accepted && docsViewed;

  const handleOpenDoc = (doc) => {
    setOpenDoc(doc);
    const now = new Date().toISOString();
    if (doc === "manual" && !viewedManual) {
      setViewedManual(true);
      setCustomer({ ...customer, manualVistoEm: now });
    }
    if (doc === "termo" && !viewedTermo) {
      setViewedTermo(true);
      setCustomer({ ...customer, termoVistoEm: now });
    }
  };

  const handleAcceptChange = (checked) => {
    setCustomer({ ...customer, accepted: checked, aceiteEm: checked ? new Date().toISOString() : null });
  };

  const handleContinue = () => {
    setTouched(true);
    if (canContinue) navigate(`/passeio/${id}/pagamento`);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-charcoal flex flex-col">
      <TopBar title="SEUS DADOS" showBack />
      <TrailProgress step={3} total={4} />
      <div className="px-4 flex flex-col gap-4">
        <div>
          <label className="text-[11px] font-semibold text-muted">NOME COMPLETO</label>
          <input
            type="text"
            value={customer.name}
            onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
            placeholder="Como está no documento"
            className="w-full mt-1 rounded-lg px-4 py-3 bg-stone border border-hline text-white placeholder:text-muted outline-none focus:border-orange"
          />
          {touched && !nameValid && <p className="text-[11px] text-[#ef4444] mt-1">Informe seu nome completo.</p>}
        </div>

        <div>
          <label className="text-[11px] font-semibold text-muted">WHATSAPP</label>
          <input
            type="tel"
            value={customer.phone}
            onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
            placeholder="(27) 9 9999-9999"
            className="w-full mt-1 rounded-lg px-4 py-3 bg-stone border border-hline text-white placeholder:text-muted outline-none focus:border-orange"
          />
          {touched && !phoneValid && <p className="text-[11px] text-[#ef4444] mt-1">Informe um WhatsApp válido.</p>}
        </div>

        <div>
          <label className="text-[11px] font-semibold text-muted">E-MAIL (OPCIONAL)</label>
          <input
            type="email"
            value={customer.email}
            onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
            placeholder="seuemail@exemplo.com"
            className="w-full mt-1 rounded-lg px-4 py-3 bg-stone border border-hline text-white placeholder:text-muted outline-none focus:border-orange"
          />
          <p className="text-[10px] text-muted mt-1">
            Se preencher, mandamos o código da sua reserva por e-mail também. Sem problema deixar em branco.
          </p>
          {touched && !emailValid && (
            <p className="text-[11px] text-[#ef4444] mt-1">Esse e-mail não parece válido — corrige ou apaga o campo.</p>
          )}
        </div>

        <div>
          <label className="text-[11px] font-semibold text-muted">CPF</label>
          <input
            type="text"
            inputMode="numeric"
            value={customer.cpf}
            onChange={(e) => setCustomer({ ...customer, cpf: formatCpf(e.target.value) })}
            placeholder="000.000.000-00"
            maxLength={14}
            className="w-full mt-1 rounded-lg px-4 py-3 bg-stone border border-hline text-white placeholder:text-muted outline-none focus:border-orange"
          />
          <p className="text-[10px] text-muted mt-1">
            Exigido pelo Mercado Pago pra processar o pagamento com segurança.
          </p>
          {touched && !cpfValid && <p className="text-[11px] text-[#ef4444] mt-1">Informe um CPF válido.</p>}
        </div>

        <div className="mt-2">
          <p className="text-[11px] font-semibold text-muted mb-2">
            LEIA ANTES DE CONTINUAR
          </p>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => handleOpenDoc("manual")}
              className="w-full flex items-center gap-3 rounded-lg px-4 py-3 bg-stone border border-hline text-left"
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-charcoal shrink-0">
                <ShieldCheck size={16} color="#f97316" />
              </div>
              <span className="flex-1 text-[13px] text-cream font-medium">
                Manual de Pilotagem Segura de Quadriciclos
              </span>
              {viewedManual ? (
                <Check size={18} color="#22c55e" />
              ) : (
                <span className="text-[10px] text-orange font-semibold">VER</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleOpenDoc("termo")}
              className="w-full flex items-center gap-3 rounded-lg px-4 py-3 bg-stone border border-hline text-left"
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-charcoal shrink-0">
                <FileText size={16} color="#f97316" />
              </div>
              <span className="flex-1 text-[13px] text-cream font-medium">
                Termo de Responsabilidade e Participação
              </span>
              {viewedTermo ? (
                <Check size={18} color="#22c55e" />
              ) : (
                <span className="text-[10px] text-orange font-semibold">VER</span>
              )}
            </button>
          </div>
          {touched && !docsViewed && (
            <p className="text-[11px] text-[#ef4444] mt-2">
              Abra e leia os dois documentos acima antes de continuar.
            </p>
          )}
        </div>

        <label
          className={`flex items-start gap-3 rounded-lg px-4 py-3 bg-stone border border-hline mt-2 ${
            !docsViewed ? "opacity-50" : ""
          }`}
        >
          <input
            type="checkbox"
            checked={customer.accepted}
            disabled={!docsViewed}
            onChange={(e) => handleAcceptChange(e.target.checked)}
            className="mt-0.5 accent-orange"
          />
          <span className="text-[12px] text-cream leading-relaxed">
            Declaro que li o Manual de Pilotagem Segura e o Termo de Responsabilidade acima, estou ciente dos
            riscos da atividade e concordo com os termos, que serão assinados no check-in presencial.
          </span>
        </label>
        {touched && docsViewed && !customer.accepted && (
          <p className="text-[11px] text-[#ef4444] -mt-2">É necessário aceitar o termo para continuar.</p>
        )}
      </div>
      {openDoc === "manual" && (
        <DocumentModal
          src="/docs/manual-pilotagem-segura.jpg"
          title="Manual de Pilotagem Segura"
          onClose={() => setOpenDoc(null)}
        />
      )}
      {openDoc === "termo" && (
        <DocumentModal
          src="/docs/termo-responsabilidade.jpg"
          title="Termo de Responsabilidade e Participação"
          onClose={() => setOpenDoc(null)}
        />
      )}
      <div className="px-4 pb-6 mt-auto pt-4">
        <PrimaryButton onClick={handleContinue}>CONTINUAR PARA PAGAMENTO</PrimaryButton>
      </div>
    </div>
  );
}
