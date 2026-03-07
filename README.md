<div align="center">

<br/>

```
████████╗███╗   ███╗    ██████╗ ███████╗██╗   ██╗
╚══██╔══╝████╗ ████║    ██╔══██╗██╔════╝██║   ██║
   ██║   ██╔████╔██║    ██║  ██║█████╗  ██║   ██║
   ██║   ██║╚██╔╝██║    ██║  ██║██╔══╝  ╚██╗ ██╔╝
   ██║   ██║ ╚═╝ ██║    ██████╔╝███████╗ ╚████╔╝ 
   ╚═╝   ╚═╝     ╚═╝    ╚═════╝ ╚══════╝  ╚═══╝  
```

### **AI-Powered Business Briefing System**

*Diagnóstico inteligente de negócios com entrevista conversacional via IA*

<br/>

![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o--mini-412991?style=for-the-badge&logo=openai&logoColor=white)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)

<br/>

</div>

---

## ◈ Visão Geral

O **TM Dev Briefing System** é uma plataforma completa de diagnóstico empresarial com IA. O cliente faz login, responde a uma entrevista conversacional conduzida pelo GPT-4o-mini — com perguntas adaptadas ao tipo de negócio — e recebe um diagnóstico personalizado com oportunidades de automação, marketing digital e sistemas.

---

## ◆ Funcionalidades

### 🤖 Briefing com Inteligência Artificial
- Entrevista conversacional conduzida pelo GPT-4o-mini
- Perguntas adaptativas baseadas no tipo de negócio
- Múltipla escolha + campo de texto livre em cada questão
- Diagnóstico final estruturado em 8 seções

### 💾 Salvamento de Rascunho Automático
- Rascunho salvo no MongoDB a cada resposta
- Cliente pode fechar e retomar de onde parou
- Indicador de progresso (0–100%)

### 🔐 Autenticação Completa
- Registro com código de convite opcional
- Login com proteção anti-brute-force (bloqueio após 5 tentativas)
- JWT em cookie `HttpOnly + SameSite=Strict`
- Alterar nome, email e senha
- Primeiro usuário cadastrado vira **admin** automaticamente

### 📊 Dashboard Admin
- Lista de todos os diagnósticos concluídos
- Visualização completa do diagnóstico por usuário
- Gerenciamento de usuários (promover admin, ativar/desativar, excluir)

---

## ⚙️ Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 14 (Pages Router) + React 18 |
| Estilização | Tailwind CSS + CSS Variables (tema cyber) |
| Animações | Framer Motion |
| Backend | Next.js API Routes (serverless) |
| Banco de dados | MongoDB + Mongoose |
| Autenticação | JWT + bcryptjs |
| IA | OpenAI GPT-4o-mini |
| Deploy | Vercel + MongoDB Atlas |

---

## 🚀 Instalação Local

### Pré-requisitos
- Node.js 18+
- MongoDB local ou conta no [MongoDB Atlas](https://mongodb.com/atlas)
- Chave de API da [OpenAI](https://platform.openai.com/api-keys)

### Passo a passo

```bash
# 1. Clone o repositório
git clone https://github.com/Tfreire455/briefing-tmdev-v3.git
cd briefing-tmdev-v3

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com seus valores

# 4. Inicie o servidor de desenvolvimento
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

---

## 🔑 Variáveis de Ambiente

```env
# MongoDB
MONGODB_URI=mongodb+srv://user:senha@cluster.mongodb.net/briefing-tmdev

# JWT — gere com: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=sua_chave_secreta_minimo_32_chars
JWT_EXPIRES_IN=7d

# Código de convite para novos registros (deixe vazio para registro aberto)
# O primeiro usuário sempre passa sem código e vira admin
REGISTER_SECRET=seu_codigo_secreto

# OpenAI
OPENAI_API_KEY=sk-...
```

---

## 🌐 Deploy na Vercel

```bash
# 1. Suba o código para o GitHub
git add .
git commit -m "deploy"
git push origin main
```

2. Acesse [vercel.com](https://vercel.com) → **Add New Project** → selecione o repositório
3. Configure as **Environment Variables** (as mesmas do `.env`)
4. Clique em **Deploy**

> ⚠️ No MongoDB Atlas, vá em **Network Access** → **Allow Access from Anywhere** (`0.0.0.0/0`) para o Vercel conseguir conectar.

---

## 📁 Estrutura do Projeto

```
briefing-tmdev-v3/
├── components/
│   └── CircuitBg.js          # Animação SVG de circuito
├── lib/
│   ├── auth.js               # JWT, cookies, middlewares
│   └── mongodb.js            # Conexão Mongoose com cache
├── models/
│   ├── User.js               # Schema de usuário + bcrypt
│   └── Draft.js              # Rascunho do briefing por usuário
├── pages/
│   ├── index.js              # Briefing conversacional com IA
│   ├── login.js              # Tela de login
│   ├── register.js           # Cadastro com código de convite
│   ├── account.js            # Alterar perfil e senha
│   ├── dashboard.js          # Painel admin
│   └── api/
│       ├── chat.js           # Endpoint OpenAI
│       ├── draft.js          # GET/DELETE rascunho do usuário
│       ├── auth/             # register, login, logout, me, change-password, update-profile
│       └── admin/            # users, drafts
├── styles/
│   └── globals.css           # Tema cyberpunk azul elétrico
└── .env.example
```

---

## 🔌 API Reference

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| `POST` | `/api/auth/register` | — | Cria conta + login automático |
| `POST` | `/api/auth/login` | — | Autenticação com JWT cookie |
| `POST` | `/api/auth/logout` | — | Limpa sessão |
| `GET` | `/api/auth/me` | ✅ | Retorna usuário atual |
| `PATCH` | `/api/auth/update-profile` | ✅ | Altera nome/email |
| `POST` | `/api/auth/change-password` | ✅ | Altera senha |
| `POST` | `/api/chat` | ✅ | Envia resposta à IA, retorna próxima pergunta |
| `GET` | `/api/draft` | ✅ | Retorna rascunho salvo |
| `DELETE` | `/api/draft` | ✅ | Descarta rascunho |
| `GET` | `/api/admin/drafts` | 🔒 Admin | Lista diagnósticos |
| `GET` | `/api/admin/users` | 🔒 Admin | Lista usuários |
| `PATCH` | `/api/admin/users?id=` | 🔒 Admin | Altera role/status |
| `DELETE` | `/api/admin/users?id=` | 🔒 Admin | Remove usuário |

---

## 🔒 Segurança

- Senhas com **bcrypt** (salt rounds: 12)
- Brute-force: bloqueio por **15 min** após 5 tentativas falhas
- JWT em **cookie HttpOnly** (nunca exposto ao JavaScript)
- Token re-emitido após alteração de senha ou email
- Comparação de tempo constante para prevenir timing attacks
- `REGISTER_SECRET` para controlar quem pode criar conta

---

<div align="center">

**Desenvolvido por [TM Dev](https://github.com/Tfreire455)**

*Sistemas Completos · IA · Automações · WhatsApp Bots*

</div>
