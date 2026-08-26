// api/_slots.js
//
// Helper compartilhado (prefixo "_" = não conta no limite de 12 funções
// serverless da Vercel) pra descobrir quantos quadriciclos cabem por
// turno. Segue o MESMO padrão já usado pro preço: o valor "oficial" fica
// na tabela "tour_prices" (editável no /admin, aba CONFIGURAÇÕES), e só cai no
// padrão fixo de src/data.js (TOURS) se ainda não foi configurado nada
// no banco, ou se o banco estiver fora do ar.
//
// Usado por: create-booking.js (limite real na hora de salvar a reserva),
// check-availability-batch.js (selo verde/vermelho nas datas) e
// _mpConfirm.js (recuperação tardia de pagamento). Manter esses três
// sincronizados é o que permite ao Sid aumentar/diminuir vaga (ex: comprou
// quadriciclo novo, ou tirou um pra manutenção) sem precisar de deploy.

export async function getMaxQuadriciclos(supabase, tour) {
  const fallback = tour?.maxQuadriciclos || 5;
  if (!supabase || !tour) return fallback;

  const { data, error } = await supabase
    .from("tour_prices")
    .select("max_quadriciclos")
    .eq("tour_id", tour.id)
    .single();

  if (error || !data || data.max_quadriciclos == null) return fallback;
  return Number(data.max_quadriciclos);
}
