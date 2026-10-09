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

Endpoints: `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /progress`, `GET /progress`, `POST /quiz-attempts`, `GET /quiz-attempts/summary`, `POST /events` (lote de até 100 eventos de aprendizagem, idempotente) e `GET /events`.

Sem a API, a visualização continua funcionando; o progresso fica só em `localStorage`. Com login, os eventos feitos **depois** do login são enviados ao servidor; o histórico que já estava no navegador não é enviado.

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
- `server/` — Express + Prisma (SQLite local; troque para PostgreSQL em produção)
