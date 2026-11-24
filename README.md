# ds-visualizer

Plataforma web para visualização interativa de **pilha** e **lista encadeada**, com código sincronizado ao estado visual, controle passo a passo, previsão do próximo estado e quiz — alinhada ao TCC e à arquitetura do projeto.

## Rodar o frontend

```bash
npm install
npm run dev
```

Abre em `http://localhost:5173`.

Variável opcional: `VITE_API_URL`. Sem ela, o `npm run dev` usa `http://localhost:3001` e o build de produção chama a API na mesma origem do site.

## Rodar a API (progresso / auth)

```bash
cd server
npm install
cp .env.example .env   # DATABASE_URL (Postgres) + JWT_SECRET (openssl rand -hex 32)
npx prisma db push
npm run dev
```

Use **PostgreSQL** (local ou [Neon](https://neon.tech) free). O servidor não sobe sem `JWT_SECRET`; em produção o segredo precisa ter pelo menos 32 bytes. Login e registro têm limite de tentativas (429). Emails são guardados em minúsculas; para normalizar contas antigas, rode `npm run db:normalize-emails` (mostra o que mudaria) e depois `npm run db:normalize-emails -- --apply`.

Endpoints: `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /progress`, `GET /progress`, `POST /quiz-attempts`, `GET /quiz-attempts/summary`, `POST /events` (lote de até 100 eventos de aprendizagem, idempotente) e `GET /events`.

Sem a API, a visualização continua funcionando; o progresso fica só em `localStorage`. Com login, os eventos feitos **depois** do login são enviados ao servidor; o histórico que já estava no navegador não é enviado.

## Deploy gratuito (frontend + API)

| Peça | Onde | Observação |
|------|------|------------|
| Frontend | [Vercel](https://vercel.com) | Build `npm run build`, output `dist`, env `VITE_API_URL` |
| API | [Render](https://render.com) | Blueprint `render.yaml` ou Web Service com root `server` |
| Banco | [Neon](https://neon.tech) | Postgres free → cole em `DATABASE_URL` no Render |

1. Crie um projeto no Neon e copie a connection string (preferir a **direct**, sem `-pooler`).
2. No Render: New → Blueprint (usa `render.yaml`) ou Web Service (`rootDir: server`, build `npm ci && npx prisma generate`, start `npm run start:prod`). Defina `DATABASE_URL`, `JWT_SECRET` (≥ 32 bytes) e `TRUST_PROXY=1`. Deixe `CORS_ORIGIN` para depois.
3. Na Vercel: importe o repo, Framework Vite, env `VITE_API_URL=https://SUA-API.onrender.com` (sem barra no final).
4. Volte no Render e defina `CORS_ORIGIN` com a URL da Vercel (ex.: `https://seu-app.vercel.app`).
5. Teste `https://SUA-API.onrender.com/health` e o login no site.

No plano free o Render **dorme** após ~15 min ocioso (primeira request pode demorar ~1 min).

## Testes

```bash
# motor, player, quiz, eventos e rotas (frontend)
npm run test

# API
cd server && npm test
```

## Operações disponíveis

| Estrutura | Operações |
|---|---|
| Pilha | `push`, `pop`, `peek`, `isEmpty` (com underflow) |
| Lista encadeada | `inserirInicio`, `inserirFim`, `inserirEm`, `removerEm`, `removerValor`, `buscar` |

A lista tem três tipos, cada um com passos e código próprios: **simples**, **dupla** (com cabeça e cauda) e **circular** (só com cabeça; o último nó aponta de volta para ela). O código de cada operação é mostrado em português, JavaScript, Python, Java e C, com a linha atual destacada.

## Estrutura do código

- `src/engine/viva/` — motor de simulação (sem React): pilha, listas e o código das operações
- `src/engine/code/` — interpretador de código editável (ainda não ligado à interface)
- `src/engine/demo/` — animação da página inicial
- `src/components/` — interface (`lab/` simulador, `viva/` canvas e player, `engagement/` quiz, `site/` layout)
- `src/content/` — lições e banco de perguntas do quiz
- `src/learning/` — log de eventos de aprendizagem e envio ao servidor
- `src/persistence/` — progresso local, derivado do log de eventos
- `src/routing/` — rotas por hash (`#/lab?s=stack`)
- `src/api/` — client HTTP (degradação graciosa)
- `server/` — Express + Prisma (PostgreSQL; Neon free em produção)
