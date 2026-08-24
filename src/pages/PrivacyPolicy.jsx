import React from "react";
import { TopBar } from "../components/UI.jsx";
import { CONTACT } from "../data.js";

// Política de Privacidade — página exigida pela Google Play Store (URL
// obrigatória na ficha do app) e pela LGPD. Segue o mesmo padrão visual
// das outras páginas de conteúdo do app (ex: Faq.jsx).
const SECTIONS = [
  {
    title: "1. Quem somos",
    body: `Este aplicativo é operado por Galavot Adventure LTDA (CNPJ ${CONTACT.cnpj}), empresa de passeios turísticos de quadriciclo off-road sediada em Guarapari - ES. Esta política explica quais dados coletamos através do app, para que usamos e como você pode exercer seus direitos.`,
  },
  {
    title: "2. Quais dados coletamos",
    body: "Ao fazer uma reserva, coletamos: nome completo, telefone/WhatsApp e, opcionalmente, e-mail. Para o pagamento, os dados do cartão ou Pix são processados diretamente pelo Mercado Pago — não armazenamos número de cartão em nossos servidores. Também podemos registrar informações técnicas básicas de navegação (como data e hora de acesso) para segurança do sistema.",
  },
  {
    title: "3. Para que usamos seus dados",
    body: "Usamos os dados exclusivamente para: confirmar e gerenciar sua reserva, entrar em contato sobre o passeio (WhatsApp/e-mail), processar o pagamento com segurança, cumprir obrigações legais e fiscais, e melhorar a experiência do app. Não vendemos nem compartilhamos seus dados com terceiros para fins de marketing.",
  },
  {
    title: "4. Com quem compartilhamos",
    body: "Compartilhamos dados apenas com prestadores de serviço estritamente necessários para o funcionamento do app: Mercado Pago (processamento de pagamento), Resend (envio de e-mail de confirmação) e Supabase (armazenamento seguro do banco de dados). Todos esses serviços têm suas próprias políticas de segurança e privacidade.",
  },
  {
    title: "5. Por quanto tempo guardamos seus dados",
    body: "Os dados de reservas confirmadas são mantidos pelo prazo necessário para fins fiscais e de atendimento. Reservas não concluídas (pendentes ou canceladas) são removidas automaticamente do sistema em um curto período.",
  },
  {
    title: "6. Seus direitos",
    body: "Você pode solicitar a qualquer momento a confirmação, correção ou exclusão dos seus dados pessoais, conforme a Lei Geral de Proteção de Dados (LGPD). Basta entrar em contato pelo WhatsApp ou e-mail informados abaixo.",
  },
  {
    title: "7. Segurança",
    body: "Adotamos medidas técnicas de segurança para proteger seus dados, incluindo conexão criptografada (HTTPS), controle de acesso ao painel administrativo e políticas de segurança no banco de dados.",
  },
  {
    title: "8. Alterações desta política",
    body: "Esta política pode ser atualizada periodicamente para refletir melhorias no app ou mudanças legais. A versão mais recente estará sempre disponível nesta página.",
  },
];

export default function PrivacyPolicy() {
  return (
    <div className="flex-1 overflow-y-auto bg-charcoal flex flex-col">
      <TopBar title="POLÍTICA DE PRIVACIDADE" showBack />
      <div className="px-4 pb-8 flex flex-col gap-5">
        <p className="text-xs text-bone/60 pt-1">Última atualização: agosto de 2026</p>

        {SECTIONS.map((s, i) => (
          <div key={i} className="rounded-xl bg-stone border border-hline p-4">
            <h2 className="text-sm font-bold text-orange mb-1.5 tracking-wide">{s.title}</h2>
            <p className="text-sm text-bone/85 leading-relaxed">{s.body}</p>
          </div>
        ))}

        <div className="rounded-xl bg-stone border border-hline p-4">
          <h2 className="text-sm font-bold text-orange mb-1.5 tracking-wide">9. Contato</h2>
          <p className="text-sm text-bone/85 leading-relaxed">
            Dúvidas sobre seus dados ou esta política podem ser enviadas para{" "}
            <span className="text-bone">{CONTACT.email}</span> ou pelo WhatsApp{" "}
            <span className="text-bone">{CONTACT.phone}</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
