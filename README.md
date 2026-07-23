# Galavot Adventure — App de Reservas

Site/app de reserva e pagamento dos passeios de quadriciclo, pronto para
funcionar como PWA (o cliente pode "instalar" pela tela inicial do celular,
sem precisar de loja de aplicativos).

## O que já funciona
- Catálogo de passeios, calendário de datas/horários, formulário de dados do
  cliente e termo de responsabilidade
- Tela de pagamento já estruturada para o Mercado Pago (Pix e cartão)
- Layout com a identidade visual da Galavot (logo, cores, tipografia)
- Configuração de PWA (ícone, splash, "adicionar à tela inicial")

## O que falta você configurar (é rápido)
1. Conta no Mercado Pago e o Access Token
2. Publicar o projeto (passo a passo abaixo)

---

## Passo a passo para publicar (grátis, ~15 minutos)

### 1. Criar conta no GitHub (se não tiver)
Acesse https://github.com e crie uma conta gratuita.

### 2. Subir este projeto para o GitHub
- Crie um novo repositório (botão "New repository")
- Suba todos os arquivos desta pasta para o repositório
  (pode arrastar e soltar os arquivos direto pela interface do GitHub, em
  "uploading an existing file")

### 3. Criar conta na Vercel
- Acesse https://vercel.com e escolha "Continue with GitHub"
- Clique em "Add New Project" e selecione o repositório que você acabou de subir
- A Vercel detecta automaticamente que é um projeto Vite — não precisa mudar nada
- Clique em "Deploy"

Em 1-2 minutos seu site estará no ar, com um link tipo
`https://galavot-adventure.vercel.app`

### 4. Configurar o Mercado Pago
1. Crie uma conta em https://www.mercadopago.com.br (se ainda não tiver)
2. Vá em **Seu negócio > Configurações > Credenciais**
3. Copie o **Access Token de produção**
4. No painel da Vercel, vá em **Project Settings > Environment Variables** e adicione:
   - `MP_ACCESS_TOKEN` = (o token que você copiou)
   - `SITE_URL` = a URL do seu site (ex: `https://galavot-adventure.vercel.app`)
5. Clique em "Redeploy" para aplicar

### 5. Ativar o redirecionamento real de pagamento
No arquivo `src/pages/BookingPayment.jsx`, troque a linha comentada:
```js
// window.location.href = data.init_point;
```
por:
```js
window.location.href = data.init_point;
```
e remova a linha `navigate(...)` logo abaixo dela. Isso faz o cliente ser
redirecionado de verdade para a tela de pagamento do Mercado Pago.

### 6. Configurar o painel administrativo (/admin)

O painel mostra a lista de reservas e deixa você marcar cada uma como
confirmada, concluída ou cancelada.

**a) Criar o banco de dados (Supabase, gratuito):**
1. Crie uma conta em https://supabase.com
2. Clique em "New Project" (escolha uma senha de banco qualquer, só pra você)
3. Depois que o projeto for criado, vá em **SQL Editor** (menu lateral) e
   rode este comando (cole e clique em "Run"):

```sql
create table bookings (
  id uuid primary key default gen_random_uuid(),
  tour_id text,
  tour_name text,
  booking_date text,
  booking_time text,
  participants int,
  customer_name text,
  customer_phone text,
  payment_method text,
  total numeric,
  status text default 'confirmado',
  created_at timestamptz default now()
);
```

4. Vá em **Project Settings > API** e copie:
   - **Project URL** → essa é a `SUPABASE_URL`
   - **service_role key** (não é a "anon key"!) → essa é a `SUPABASE_SERVICE_ROLE_KEY`

**b) Escolher a senha do painel:**
- Invente uma senha forte → essa é a `ADMIN_PASSWORD`
- Invente também uma segunda frase aleatória (pode ser qualquer texto
  longo e difícil de adivinhar) → essa é a `ADMIN_SECRET`

**c) Configurar tudo na Vercel:**
No painel da Vercel, vá em **Project Settings > Environment Variables** e
adicione as 4 variáveis: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
`ADMIN_PASSWORD`, `ADMIN_SECRET`. Depois clique em "Redeploy".

**d) Acessar o painel:**
Vá em `https://seu-site.vercel.app/admin`, digite a senha, e pronto — você
verá todas as reservas feitas pelo site.

### 7. Configurar a Área de Parceiros (/parceiro)

A área de parceiros usa o **mesmo banco (Supabase)** e a **mesma chave
secreta (ADMIN_SECRET)** que já configurou no passo 6 — não precisa
cadastrar nenhuma variável nova na Vercel.

Só falta rodar mais este SQL no **SQL Editor** do Supabase:

```sql
-- Tabela de parceiros
create table partners (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  empresa text,
  codigo text not null unique,
  senha_hash text not null,
  comissao_percentual numeric default 10,
  ativo boolean default true,
  created_at timestamptz default now()
);

-- Vincula cada reserva a um parceiro (quando aplicável) e guarda a comissão
alter table bookings add column partner_id uuid references partners(id);
alter table bookings add column comissao_valor numeric;
alter table bookings add column comissao_paga boolean default false;
```

### Proteção contra força bruta no login (recomendado)

Pra dificultar tentativas de adivinhar a senha do `/admin` ou do `/parceiro`,
o sistema bloqueia por 15 minutos um IP que errar a senha 8 vezes seguidas.
Isso precisa de mais uma tabelinha no Supabase — rode este SQL também no
**SQL Editor**:

```sql
create table login_attempts (
  id uuid primary key default gen_random_uuid(),
  ip text not null,
  scope text not null,
  created_at timestamptz default now()
);
create index login_attempts_ip_scope_idx on login_attempts (ip, scope, created_at);
```

Se você não rodar esse SQL, o login continua funcionando normalmente — só
fica sem essa proteção extra contra força bruta.

### Camada extra: Row Level Security (RLS)

Todo o acesso ao banco passa pelas funções em `api/` (usando a chave
`service_role`, que sempre ignora o RLS) — o navegador do cliente nunca
fala direto com o Supabase. Por isso o RLS não é obrigatório aqui. Mesmo
assim, é uma boa prática de segurança em camadas: ativa o RLS sem nenhuma
política, o que bloqueia por padrão qualquer acesso vindo de fora das
funções do servidor (caso a chave pública do projeto seja usada ou exposta
por engano no futuro). Não muda nada no funcionamento do site. Rode no
**SQL Editor** do Supabase:

```sql
alter table bookings enable row level security;
alter table partners enable row level security;
alter table login_attempts enable row level security;
```

**Como cadastrar um parceiro:** entre em `/admin` → aba **PARCEIROS** →
**+ Novo Parceiro**. Você escolhe o nome, código de acesso (o parceiro vai
usar isso pra logar) e uma senha. O parceiro acessa em `/parceiro` com
esses dados.

**Como funciona pro parceiro:** ele loga, vê "Minhas Reservas" e o total
de comissão pendente, e usa o botão "Nova Reserva" — que abre exatamente
o mesmo fluxo de reserva do cliente final. A única diferença é que a
reserva feita por ele já grava automaticamente o vínculo e a comissão
(10% por padrão, editável por parceiro).

**Como fechar a comissão:** no painel `/admin`, aba Parceiros, tem o botão
"Marcar como pago" que zera o pendente daquele parceiro (assim que você
fizer o repasse por fora).

### 8. Domínio próprio (opcional)
Se quiser um domínio tipo `galavotadventure.com.br`:
- Compre o domínio (Registro.br, ~R$40/ano)
- Na Vercel, vá em **Project Settings > Domains** e siga as instruções para
  apontar o domínio comprado

### 9. "Instalar" o app no celular
Depois de publicado, ao acessar o site pelo Chrome (Android) ou Safari (iPhone),
vai aparecer a opção **"Adicionar à tela de início"**. O ícone com nosso logo
fica salvo no celular do cliente, funcionando como um app de verdade.

---

## Rodar localmente (para testar antes de publicar)
Requer Node.js instalado (https://nodejs.org).

```bash
npm install
npm run dev
```

Abra o link que aparecer no terminal (geralmente `http://localhost:5173`).

## Estrutura do projeto
```
src/
  pages/        → cada tela do app (Home, Passeios, Reserva, Pagamento...)
  components/   → peças reutilizáveis (logo, menu inferior, botões)
  context/      → guarda os dados da reserva enquanto o cliente navega
  data.js       → passeios, horários e contato — edite aqui os preços e vagas
api/
  create-preference.js → conecta com o Mercado Pago
public/
  logo.png, icon-192.png → ícones do app
```

## Próximos passos sugeridos
- Trocar os dados fixos de `src/data.js` por um banco de dados real (ex:
  Supabase) quando o volume de reservas crescer
- Adicionar confirmação por e-mail/WhatsApp automática
- Configurar o domínio próprio

<!-- Acesso via Claude configurado em 2026-07-20 -->
