import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, UserRound } from "lucide-react";
import { Logo, PrimaryButton } from "../components/UI.jsx";

export default function PartnerLogin() {
  const navigate = useNavigate();
  const [codigo, setCodigo] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/partner-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo, senha }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao entrar");
      sessionStorage.setItem("galavot_partner_token", data.token);
      sessionStorage.setItem("galavot_partner_id", data.partner.id);
      sessionStorage.setItem("galavot_partner_name", data.partner.nome);
      navigate("/parceiro/painel");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-charcoal px-6">
      <Logo size={72} />
      <div className="font-display text-white text-xl mt-4">ÁREA DO PARCEIRO</div>
      <div className="text-[12px] text-muted mt-1 text-center">Acesso exclusivo para parceiros de vendas</div>
      <form onSubmit={handleLogin} className="w-full flex flex-col gap-3 mt-6">
        <div className="flex items-center gap-2 rounded-lg px-4 py-3 bg-stone border border-hline">
          <UserRound size={16} color="#B7AFA2" />
          <input
            type="text"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            placeholder="Código de acesso"
            className="bg-transparent outline-none text-white flex-1 placeholder:text-muted"
          />
        </div>
        <div className="flex items-center gap-2 rounded-lg px-4 py-3 bg-stone border border-hline">
          <Lock size={16} color="#B7AFA2" />
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Senha"
            className="bg-transparent outline-none text-white flex-1 placeholder:text-muted"
          />
        </div>
        {error && <p className="text-[12px] text-orange">{error}</p>}
        <PrimaryButton type="submit" disabled={loading || !codigo || !senha}>
          {loading ? "ENTRANDO..." : "ENTRAR"}
        </PrimaryButton>
      </form>
    </div>
  );
}
