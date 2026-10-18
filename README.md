# Energon Sentinel

Painel interno da **Energon** para cadastrar sistemas/serviços, guardar credenciais com criptografia, monitorar saúde e receber alertas por e-mail.

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind CSS
- PostgreSQL + Prisma
- Worker BullMQ + Redis
- E-mail via Resend (ou SMTP)
- Auth: Argon2id + 2FA TOTP (obrigatório para `owner`)

## Pré-requisitos

- Node.js 22+
- Docker + Docker Compose (recomendado)
- Conta Resend (opcional no início)

## 1. Configurar ambiente

```bash
cp .env.example .env
```

Gere a chave mestra (32 bytes em base64):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Cole o valor em `MASTER_KEY` no `.env`.

Gere também um `SESSION_SECRET` longo (≥ 32 caracteres).

## 2. Subir com Docker (painel + worker + Postgres + Redis)

```bash
docker compose up --build -d
docker compose exec web npx prisma db seed
```

Acesse: http://localhost:3000

Credenciais do owner vêm de `SEED_OWNER_EMAIL` / `SEED_OWNER_PASSWORD` no `.env`.

No primeiro login o owner **deve** ativar o 2FA (QR Code).

## 3. Desenvolvimento local (sem Docker da app)

Suba só a infraestrutura:

```bash
docker compose up -d postgres redis
```

Instale e migre:

```bash
npm install
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

Em outro terminal, o worker:

```bash
npm run worker
```

## 4. Configurar e-mail

### Resend (preferencial)

1. Crie API key em https://resend.com
2. Defina `RESEND_API_KEY` e `EMAIL_FROM`
3. Em **Alertas**, cadastre o e-mail destinatário

### SMTP (fallback)

Se `RESEND_API_KEY` estiver vazio, o painel usa `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`.

## 5. Cadastrar o primeiro sistema

1. Entre em **Sistemas → Novo sistema**
2. Abra o sistema e adicione serviços (front, back, banco, etc.)
3. Em cada serviço, use **Abrir painel / Hospedagem / Git**
4. Em **Cofre**, cadastre credenciais (criptografadas em AES-256-GCM)
5. Adicione health checks HTTP (ex.: `/health`) e use **Rodar agora**
6. Em **Alertas**, configure destinatários de e-mail

## 6. Deploy em VPS

1. Clone o repositório na VPS
2. Configure `.env` com `APP_URL=https://seu-dominio`, `COOKIE_SECURE=true`, `MASTER_KEY`, `SESSION_SECRET`, e-mail
3. Opcional: `ALLOWED_IPS=x.x.x.x` para restringir acesso
4. `docker compose up --build -d`
5. `docker compose exec web npx prisma db seed` (só na primeira vez)
6. Coloque um reverse proxy (Caddy/Nginx) com HTTPS na porta 3000

## Segurança

- Segredos **nunca** em plaintext no banco
- Revelar/copiar credencial exige reautenticação (senha ou 2FA) nos últimos 5 minutos
- Clipboard é limpa após 30s no cliente
- Auditoria em `AuditLog`
- Cookies `HttpOnly`, `Secure` (prod), `SameSite=Strict`

## Scripts úteis

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Next.js em desenvolvimento |
| `npm run worker` | Worker de monitoramento |
| `npm run db:migrate` | Migrations |
| `npm run db:seed` | Cria/atualiza o owner e limpa demos |
| `npm test` | Testes (crypto, incidentes, reauth) |

## Documentação de arquitetura

Veja [ARQUITETURA.md](./ARQUITETURA.md).

## Status público (opt-in)

Para página de status pública, ative `statusPageEnabled` + `statusPageSlug` no sistema (sem URLs internas nem credenciais).
