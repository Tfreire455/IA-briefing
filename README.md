# TM Dev — Briefing System v3

Sistema completo com autenticação MongoDB, registro, login, alteração de senha, gerenciamento de usuários, dashboard protegido e formulário de briefing com 12 etapas.

---

## 🚀 Instalação & Uso

```bash
npm install
npm start       # http://localhost:3000
npm run dev     # dev com hot-reload
```

---

## ⚙️ Configuração (.env)

| Variável | Descrição |
|---|---|
| `MONGODB_URI` | URI do MongoDB (local ou Atlas) |
| `JWT_SECRET` | Chave secreta JWT (mín. 32 chars) |
| `JWT_EXPIRES_IN` | Expiração do token (ex: `7d`) |
| `REGISTER_SECRET` | Código de convite para registro (opcional) |

---

## 📄 Páginas

| Rota | Acesso | Descrição |
|---|---|---|
| `/` | Público | Formulário de briefing (12 etapas) |
| `/login` | Público | Login com email/senha |
| `/register` | Público | Cadastro com código de convite opcional |
| `/dashboard` | 🔒 Auth | Painel de briefings + gerenciamento de usuários |
| `/account` | 🔒 Auth | Alterar perfil e senha |

---

## 🔌 API

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| `POST` | `/api/auth/register` | — | Cria conta + login automático |
| `POST` | `/api/auth/login` | — | Login JWT em cookie HttpOnly |
| `POST` | `/api/auth/logout` | — | Limpa cookie |
| `GET` | `/api/auth/me` | ✅ | Retorna usuário autenticado |
| `PATCH` | `/api/auth/update-profile` | ✅ | Altera nome/email |
| `POST` | `/api/auth/change-password` | ✅ | Altera senha (exige atual) |
| `POST` | `/api/briefings` | — | Salva briefing público |
| `GET` | `/api/briefings` | ✅ | Lista briefings (busca, filtro, página) |
| `GET` | `/api/briefings/:id` | ✅ | Retorna briefing completo |
| `PATCH` | `/api/briefings/:id` | ✅ | Atualiza status/notas |
| `DELETE` | `/api/briefings/:id` | ✅ | Remove briefing |
| `GET` | `/api/admin/users` | 🔒 Admin | Lista usuários |
| `PATCH` | `/api/admin/users?id=` | 🔒 Admin | Altera role/active |
| `DELETE` | `/api/admin/users?id=` | 🔒 Admin | Remove usuário |

---

## 🔐 Segurança

- Senhas com **bcrypt** (salt rounds: 12)
- Validação: mín. 8 chars, 1 maiúscula, 1 número
- **Proteção anti-brute-force**: bloqueio após 5 tentativas por 15 minutos
- JWT em **cookie HttpOnly + SameSite=Strict**
- Token re-emitido após alterar senha ou perfil
- Comparação constante para evitar timing attacks
- **Primeiro usuário cadastrado vira admin automaticamente**
- REGISTER_SECRET opcional para controlar quem pode se cadastrar

---

## 🎨 Design

- **Tema:** Cyberpunk Azul Elétrico
- **Fontes:** Orbitron + Exo 2 + Share Tech Mono
- **Animações:** Circuit board SVG, scanlines, glow pulse, Framer Motion
- **Stack:** Next.js 14 + Mongoose + JWT + Tailwind CSS

---

*TM Dev — Sistemas Completos, IA e Automações*
