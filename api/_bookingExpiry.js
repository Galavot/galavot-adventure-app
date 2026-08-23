// api/_bookingExpiry.js
//
// Reservas em "pendente_pagamento" ocupam a vaga desde o momento em que
// são criadas (mesmo sem pagamento confirmado ainda), pra não vender a
// mesma vaga duas vezes enquanto alguém está pagando. Mas se a pessoa
// nunca completar o pagamento, essa vaga não pode ficar travada pra
// sempre. Esse helper expira (marca como "pagamento_recusado") qualquer
// reserva pendente com mais de PENDING_LIMIT_MINUTES, liberando a vaga de
// volta pra venda.
//
// Não existe um "robô" rodando sozinho em segundo plano — a Vercel Hobby
// não permite isso com a frequência necessária. Em vez disso, essa
// limpeza roda "de passagem" toda vez que alguém checa disponibilidade ou
// tenta criar uma reserva, sempre ANTES de contar as vagas ocupadas.

export const PENDING_LIMIT_MINUTES = 20;

// Expira reservas pendentes vencidas de um passeio específico (usado na
// hora de criar uma reserva nova, onde já sabemos tourId e a data exata).
export async function expireStalePendingBookings(supabase, tourId, bookingDate) {
  const cutoff = new Date(Date.now() - PENDING_LIMIT_MINUTES * 60 * 1000).toISOString();

  await supabase
    .from("bookings")
    .update({ status: "pagamento_recusado" })
    .eq("tour_id", tourId)
    .eq("booking_date", bookingDate)
    .eq("status", "pendente_pagamento")
    .lt("created_at", cutoff);
}

// Versão em lote pra várias datas de uma vez (usado na tela de calendário,
// que checa os próximos 30 dias juntos).
export async function expireStalePendingBookingsBatch(supabase, tourId, bookingDates) {
  const cutoff = new Date(Date.now() - PENDING_LIMIT_MINUTES * 60 * 1000).toISOString();

  await supabase
    .from("bookings")
    .update({ status: "pagamento_recusado" })
    .eq("tour_id", tourId)
    .in("booking_date", bookingDates)
    .eq("status", "pendente_pagamento")
    .lt("created_at", cutoff);
}
