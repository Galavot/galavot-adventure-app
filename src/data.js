export const TOURS = [
  {
    id: "matinal",
    name: "PASSEIO MATINAL",
    time: "A partir das 9h",
    duration: "3h a 4h",
    level: "Iniciante",
    price: 350,
    maxQuadriciclos: 5,
    image: "/fotos/passeio-matinal.jpg",
    desc: "Trilhas off-road em meio à Mata Atlântica, com barro, subidas e descidas cheias de adrenalina. Passamos pelo Distrito de Buenos Aires, paramos em mirantes com vista pra Pedra do Elefante e terminamos com banho de cachoeira na Morosini.",
    includes: [
      "Quadriciclo com guia experiente durante todo o percurso",
      "Combustível e suporte mecânico inclusos",
      "Equipamentos de segurança (capacete e afins)",
      "Fotos registradas durante o passeio",
    ],
    weight:
      "Valor por quadriciclo (até 2 pessoas). O valor não altera caso vá apenas 1 pessoa. Peso máximo permitido: 180kg (piloto + passageiro). Crianças a partir de 10 anos podem participar como passageiras (na garupa), acompanhadas dos pais ou responsável.",
  },
  {
    id: "vespertino",
    name: "PASSEIO VESPERTINO",
    time: "A partir das 13h",
    duration: "3h a 4h",
    level: "Iniciante",
    price: 350,
    maxQuadriciclos: 5,
    image: "/fotos/passeio-vespertino.jpg",
    desc: "O mesmo roteiro de aventura, natureza e cachoeira — só que com a luz da tarde caindo sobre o litoral de Guarapari. Ideal pra quem viaja em casal ou em grupo e quer fechar o dia com uma vista incrível do mar.",
    includes: [
      "Quadriciclo com guia experiente durante todo o percurso",
      "Combustível e suporte mecânico inclusos",
      "Equipamentos de segurança (capacete e afins)",
      "Fotos registradas durante o passeio",
    ],
    weight:
      "Valor por quadriciclo (até 2 pessoas). O valor não altera caso vá apenas 1 pessoa. Peso máximo permitido: 180kg (piloto + passageiro). Crianças a partir de 10 anos podem participar como passageiras (na garupa), acompanhadas dos pais ou responsável.",
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
  duration: "3h a 4h",
  distance: "15 km",
  level: "4 de 5",
  included: ["Quadriciclo", "Capacete", "Guia", "Suporte mecânico durante o passeio", "Fotos (registradas durante o passeio)"],
  notIncluded: ["Alimentação", "Bebidas", "Taxa de entrada na Cachoeira Morosini"],
};

// Gera os próximos dias automaticamente a partir de hoje — assim a data
// "HOJE" sempre está correta, sem precisar editar isso manualmente.
const WEEKDAYS = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"];
const MONTHS = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

export function getUpcomingDates(days = 6) {
  const result = [];
  const today = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const label = i === 0 ? "HOJE" : i === 1 ? "AMANHÃ" : WEEKDAYS[d.getDay()];
    const sub = `${String(d.getDate()).padStart(2, "0")} ${MONTHS[d.getMonth()]}`;
    const iso = d.toISOString().slice(0, 10);
    result.push({ label, sub, iso });
  }
  return result;
}

export const CONTACT = {
  name: "Jorge Galavot",
  phone: "(27) 99992-7056",
  whatsapp: "5527999927056",
  instagram: "@galavotadventureoficial",
  instagramUrl: "https://www.instagram.com/galavotadventureoficial?igsh=ZXl3cTY2bzJhOG5j",
  facebookUrl: "https://www.facebook.com/share/1JFThnYbD2/",
  tiktokUrl: "https://www.tiktok.com/@galavotadventureoficial",
  youtubeUrl: "https://www.youtube.com/@galavotadventure.oficial",
  kwaiUrl: "https://k.kwai.com/u/@galavotadventureofic/xYLjCG6z",
  email: "galavotadventure.oficial@gmail.com",
  city: "Guarapari - ES",
  // Preencha assim que o CNPJ sair (ex: "12.345.678/0001-90") — ele aparece
  // sozinho no rodapé do Perfil assim que esse campo deixar de estar vazio.
  cnpj: "",
  meetingPoint: {
    address: "Estr. Rota da Ferradura - Guarapari, ES, 29227-640",
    lat: -20.643258,
    lng: -40.559039,
    mapsUrl: "https://www.google.com/maps/dir/?api=1&destination=-20.643258,-40.559039",
  },
};

export const SECONDARY_CONTACT = {
  name: "Sidnei Pereira",
  phone: "(14) 99123-2345",
  whatsapp: "5514991232345",
};
