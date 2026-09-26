# ds-visualizer

Plataforma web para visualização interativa de **pilha** e **lista encadeada**, com código sincronizado ao estado visual, controle passo a passo, previsão do próximo estado e quiz — alinhada ao TCC e à arquitetura do projeto.

## Rodar o frontend

```bash
npm install
npm run dev
```

Abre em `http://localhost:5173`.

Variável opcional: `VITE_API_URL` (padrão `http://localhost:3001`).

## Rodar a API (progresso / auth)

```bash
cd server
npm install
npx prisma db push
npm run dev
```

Endpoints: `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /progress`, `GET /progress`, `POST /quiz-attempts`, `GET /quiz-attempts/summary`.

Sem a API, a visualização continua funcionando; progresso fica só em `localStorage`.

## Testes

```bash
# motor + store (frontend)
npm run test

# API
cd server && npm test
```

## Operações disponíveis

| Estrutura | Operações |
|---|---|
| Pilha | `push`, `pop` |
| Lista encadeada | `insertAtHead`, `insertAtTail`, `remove` (por valor) |

## Estrutura do código

- `src/engine/` — motor de simulação (sem React)
- `src/state/` — Zustand + playback
- `src/components/` — UI
- `src/persistence/` — progresso local
- `src/api/` — client HTTP (degradação graciosa)
- `server/` — Express + Prisma (SQLite local; troque para PostgreSQL em produção)
