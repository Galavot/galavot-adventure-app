export const TOURS = [
  {
    id: "matinal",
    name: "PASSEIO MATINAL",
    time: "08:00 – 11:00",
    duration: "3h",
    level: "Iniciante",
    price: 350,
    image: "/fotos/passeio-matinal.jpg",
    desc: "Trilhas off-road em meio à Mata Atlântica, com barro, subidas e descidas cheias de adrenalina. Passamos pelo Distrito de Buenos Aires, paramos em mirantes com vista pra Pedra do Elefante e terminamos com banho de cachoeira na Morosini.",
    includes: [
      "Quadriciclo com guia experiente durante todo o percurso",
      "Combustível e suporte mecânico inclusos",
      "Equipamentos de segurança (capacete e afins)",
      "Fotos registradas durante o passeio",
    ],
    weight: "Valor por quadriciclo (até 2 pessoas). O valor não altera caso vá apenas 1 pessoa.",
  },
  {
    id: "vespertino",
    name: "PASSEIO VESPERTINO",
    time: "14:00 – 17:00",
    duration: "3h",
    level: "Iniciante",
    price: 350,
    image: "/fotos/passeio-vespertino.jpg",
    desc: "O mesmo roteiro de aventura, natureza e cachoeira — só que com a luz da tarde caindo sobre o litoral de Guarapari. Ideal pra quem viaja em casal ou em grupo e quer fechar o dia com uma vista incrível do mar.",
    includes: [
      "Quadriciclo com guia experiente durante todo o percurso",
      "Combustível e suporte mecânico inclusos",
      "Equipamentos de segurança (capacete e afins)",
      "Fotos registradas durante o passeio",
    ],
    weight: "Valor por quadriciclo (até 2 pessoas). O valor não altera caso vá apenas 1 pessoa.",
  },
];

// Detalhamento do roteiro (Rota 04 — Buenos Aires & Cachoeira Morosini),
// usado na tela de detalhes do passeio.
export const ROUTE_STOPS = [
  { title: "Café Figueira", desc: "Recepção, orientações de segurança, entrega dos capacetes e teste dos quadriciclos." },
  { title: "Saída para a Serra", desc: "Início do passeio em direção ao distrito de Buenos Aires, alternando asfalto e estradas rurais." },
  { title: "Trilhas Off-Road", desc: "Trechos com barro, pedras, subidas, descidas e muita adrenalina em meio à Mata Atlântica." },
  { title: "Mirantes Naturais", desc: "Paradas para fotos panorâmicas das montanhas e da região da Pedra do Elefante." },
  { title: "Distrito de Buenos Aires", desc: "Passagem pela comunidade rural, observando a cultura e o cenário típico das montanhas capixabas." },
  { title: "Cachoeira Morosini", desc: "Banho de cachoeira, descanso, contemplação da natureza e tempo livre para fotos." },
  { title: "Estrutura Local", desc: "Possibilidade de consumo de bebidas e petiscos (pagamento à parte) e utilização da estrutura." },
  { title: "Retorno", desc: "Volta pelas trilhas até o ponto inicial, encerrando a aventura." },
];

export const ROUTE_INFO = {
  duration: "4 horas",
  distance: "15 km",
  level: "4 de 5",
  included: ["Quadriciclo", "Capacete", "Guia", "Suporte mecânico durante o passeio", "Fotos (registradas durante o passeio)"],
  notIncluded: ["Alimentação", "Bebidas", "Taxa de entrada na Cachoeira Morosini"],
};

export const DATES = [
  { label: "HOJE", sub: "15 JUL", iso: "2026-07-15" },
  { label: "QUI", sub: "16 JUL", iso: "2026-07-16" },
  { label: "SEX", sub: "17 JUL", iso: "2026-07-17" },
  { label: "SAB", sub: "18 JUL", iso: "2026-07-18" },
  { label: "DOM", sub: "19 JUL", iso: "2026-07-19" },
];

export const SLOTS = [
  { time: "08:00", vagas: 4 },
  { time: "09:30", vagas: 2 },
  { time: "11:00", vagas: 0 },
];

export const CONTACT = {
  name: "Jorge Galavot",
  phone: "(27) 99992-7056",
  whatsapp: "5527999927056",
  instagram: "@galavotadventureoficial",
  city: "Guarapari - ES",
};
