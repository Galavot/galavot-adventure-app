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

### 6. Domínio próprio (opcional)
Se quiser um domínio tipo `galavotadventure.com.br`:
- Compre o domínio (Registro.br, ~R$40/ano)
- Na Vercel, vá em **Project Settings > Domains** e siga as instruções para
  apontar o domínio comprado

### 7. "Instalar" o app no celular
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
