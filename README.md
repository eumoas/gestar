# Gestar — Etapa 1

Protótipo de plataforma de acompanhamento da gestação e do puerpério inspirada na
jornada da Caderneta da Gestante do Ministério da Saúde, construído como avaliação
intermediária da disciplina de IA Generativa (Pós-graduação em IA Aplicada,
UniSENAI/FIESC). A especificação completa do produto — problema, arquitetura,
modelo de dados, divisão em etapas e engenharia de LLM planejada para a Etapa 2 —
está em [`SDD-gestar.md`](SDD-gestar.md). Este README documenta o que existe hoje,
como rodar e como foi construído.

> **Aviso de protótipo.** Todos os dados são fictícios (gerados por seed). Toda
> triagem é simulada por um motor de regras determinístico e rotulada como tal —
> nenhuma resposta vem de um modelo de IA nesta etapa, e nada aqui substitui
> atendimento médico.

## Sumário

- [Sobre o projeto](#sobre-o-projeto)
- [Escopo desta etapa](#escopo-desta-etapa)
- [Arquitetura](#arquitetura)
- [Como rodar localmente](#como-rodar-localmente)
- [Telas e fluxo de navegação](#telas-e-fluxo-de-navegação)
- [Referência da API](#referência-da-api)
- [Motor de triagem simulada](#motor-de-triagem-simulada)
- [Dados de demonstração (seed)](#dados-de-demonstração-seed)
- [Processo de desenvolvimento com o agente de codificação](#processo-de-desenvolvimento-com-o-agente-de-codificação)
- [Deploy](#deploy)
- [Limitações conhecidas e próximos passos](#limitações-conhecidas-e-próximos-passos)

## Sobre o projeto

O Brasil registra mortes maternas evitáveis em número incompatível com a cobertura
da atenção primária. A Caderneta da Gestante — principal instrumento de
acompanhamento do pré-natal no SUS — permanece em papel na maior parte dos
territórios, e equipes de saúde da família acompanham dezenas de gestantes com
pouca visibilidade sobre sinais de alerta entre consultas.

O Gestar propõe duas frentes conectadas pelo mesmo backend:

- **Jornada da gestante** (mobile-first): onboarding com cálculo automático de
  idade gestacional e DPP, carteira de pré-natal por trimestre, diário de
  sintomas com triagem e card de resultado.
- **Painel da equipe** (desktop): semáforo de risco do território, fila de
  alertas com ação de tratamento e visão por gestante.

## Escopo desta etapa

Este repositório implementa a **Etapa 1** do SDD: aplicação completa de UI,
navegável de ponta a ponta, com endpoint funcional — **sem nenhum modelo de IA**.
A triagem é feita por um motor de regras determinístico (ver
[Motor de triagem simulada](#motor-de-triagem-simulada)), e toda resposta vem
marcada com `"simulado": true`.

A **Etapa 2** (fora deste repositório nesta fase) substitui esse motor por um
pipeline de LLM com ferramentas e RAG sobre o protocolo do Ministério da Saúde,
mantendo o mesmo contrato de interface — ver seção 9 do SDD. Um bot de Telegram
para lembretes de consulta e orientações é uma ideia registrada para uma eventual
Etapa 3, documentada e fora do escopo avaliado por ora (seção 12 do SDD).

## Arquitetura

```
frontend (React 18 + Vite, react-router-dom)
   │  REST/JSON via /api (proxy do Vite em dev; mesma origem em produção)
   ▼
backend (FastAPI)
   ├── app/main.py                 rotas de gestante, equipe e triagem
   ├── app/services/triagem_mock.py  motor de regras (Etapa 1)
   └── estado em memória            sem banco nesta etapa (ver observação abaixo)
```

Em produção (Railway), o build do React é servido como estático pelo próprio
FastAPI (porta única) — ver [Deploy](#deploy).

**Observação sobre o SDD e o banco de dados.** O SDD (seção 4) especifica
PostgreSQL desde a Etapa 1, justificado pela continuidade com o pgvector da
Etapa 2. Nesta implementação da Etapa 1, o estado (gestantes, sintomas, alertas,
overrides da carteira) ainda vive em memória no processo do FastAPI, por
simplicidade enquanto o foco era fechar a navegação de ponta a ponta. Isso é uma
divergência assumida em relação ao SDD, não um requisito alterado: os dados são
perdidos a cada reinício do processo, e a migração para PostgreSQL via
SQLAlchemy é o próximo passo natural antes de (ou junto com) a Etapa 2 — ver
[Limitações conhecidas](#limitações-conhecidas-e-próximos-passos).

### Estrutura de pastas

```
.
├── SDD-gestar.md              documento de design (fonte da verdade do produto)
├── PROMPTS.md                 registro do processo com o agente de codificação
├── requirements.txt           dependências Python (backend)
├── backend/
│   └── app/
│       ├── main.py            FastAPI: rotas + serve o build do frontend
│       └── services/
│           └── triagem_mock.py  motor de regras determinístico
├── frontend/
│   └── src/
│       ├── pages/             as 6 telas (uma por rota)
│       ├── components/        NavBar, GestanteSwitcher
│       ├── context/           GestanteContext (perfil demo selecionado)
│       └── api.js             client fetch para o backend
└── docs/screenshots/          capturas de tela de cada rota (ver PROMPTS.md)
```

## Como rodar localmente

Requisitos: Python 3.12+ e Node 18+.

**1. Backend (porta 8000)**

```bash
cd backend
pip install -r ../requirements.txt
uvicorn app.main:app --reload --port 8000
```

**2. Frontend (porta 5173)**

```bash
cd frontend
npm install
npm run dev
```

Acesse `http://localhost:5173`. O Vite faz proxy de `/api/*` para
`http://127.0.0.1:8000` (configurado em `frontend/vite.config.js`), então as
duas partes conversam sem configuração extra de CORS.

**Rodando como em produção (porta única, sem Vite dev server):**

```bash
cd frontend && npm run build && cd ..
cd backend && uvicorn app.main:app --port 8000
```

Nesse modo o FastAPI detecta `frontend/dist` e passa a servir o React já
buildado na raiz (`/`), com a API continuando em `/api/*` — é exatamente o que
acontece no deploy (ver [Deploy](#deploy)).

## Telas e fluxo de navegação

Não há autenticação nesta etapa. Em vez disso, existe um seletor de "perfil
demo" (`GestanteSwitcher`) que troca qual gestante fictícia está ativa em todas
as telas da jornada; a escolha persiste no `localStorage` do navegador.

| Rota | Tela | O que faz |
|---|---|---|
| `/` | Início | Saudação, idade gestacional/DPP calculados, linha do tempo da jornada |
| `/onboarding` | Cadastro | Formulário de nova gestante (nome, DUM, paridade, condições prévias) |
| `/carteira` | Carteira de pré-natal | Consultas e exames agrupados por trimestre, com marcação manual de status |
| `/diario` | Diário de sintomas | Checklist de sintomas do dia + histórico de registros anteriores |
| `/triagem` | Resultado da triagem | Card de nível de risco (verde/amarelo/vermelho) do último registro |
| `/equipe` | Painel da equipe | Semáforo do território, fila de alertas pendentes, lista de gestantes |

Screenshots de cada tela estão em [`docs/screenshots/`](docs/screenshots/).

## Referência da API

Todas as rotas abaixo estão sob o prefixo `/api`. Corpos de requisição/resposta
em JSON.

| Método | Rota | Descrição |
|---|---|---|
| GET | `/gestantes` | Lista todas as gestantes (com semanas/trimestre/DPP calculados) |
| POST | `/gestantes` | Cria gestante — `{nome, dum, paridade?, condicoes_previas?}` |
| GET | `/gestantes/{id}` | Detalhe de uma gestante |
| GET | `/gestantes/{id}/jornada` | Linha do tempo consolidada |
| GET | `/gestantes/{id}/carteira` | Itens da carteira (consultas + exames) por trimestre |
| PATCH | `/gestantes/{id}/carteira` | Atualiza status de um item — `{item_id, status}` |
| GET | `/gestantes/{id}/sintomas` | Histórico de registros do diário de sintomas |
| POST | `/gestantes/{id}/sintomas` | Registra sintomas e dispara a triagem — `{sintomas: string[]}` |
| POST | `/gestantes/{id}/epds` | Registra respostas do EPDS e pontua — `{respostas: {}}` |
| GET | `/equipe/dashboard` | Contagem por nível de risco + resumo por gestante |
| GET | `/equipe/alertas` | Lista de alertas gerados pela triagem |
| PATCH | `/equipe/alertas/{id}` | Marca um alerta como tratado |

Toda resposta de triagem (`/sintomas` e `/epds`) inclui `"simulado": true`.

## Motor de triagem simulada

Implementado em `backend/app/services/triagem_mock.py` como regras
determinísticas — nenhuma chamada a LLM nesta etapa. Cenário principal de
demonstração (usado nos exemplos e screenshots deste README):

- **Cefaleia intensa + visão embaçada + edema, antes de 37 semanas → vermelho**
  (padrão compatível com pré-eclâmpsia; orientação de procurar UBS ou
  maternidade).
- Contrações regulares antes de 37 semanas → vermelho.
- EPDS ≥ 13 → vermelho; entre 10 e 12 → amarelo.
- Demais combinações → verde ou amarelo, com orientação de autocuidado.

O protocolo do SDD também prevê sangramento como sinal vermelho em qualquer
fase da gestação; essa regra continua implementada no motor (para fidelidade
clínica e testável via API), mas **não é exposta como opção no diário de
sintomas da interface** — decisão de produto para evitar um item sensível no
meio de demonstrações com público variado. O cenário de cefaleia/pré-eclâmpsia
é o caminho vermelho de referência na UI.

## Dados de demonstração (seed)

Oito gestantes fictícias são geradas em memória a cada início do backend, com
DUM calculada **relativa à data atual** (não fixa) — assim elas sempre aparecem
espalhadas de forma plausível entre o 1º e o 3º trimestre, não importa em que
dia o protótipo for demonstrado. Uma delas (Sofia Rocha) já nasce com um alerta
vermelho pendente, para que o painel da equipe seja demonstrável imediatamente
após subir a aplicação, sem precisar registrar sintomas manualmente primeiro.

## Processo de desenvolvimento com o agente de codificação

O histórico completo de prompts, resultados e ajustes está em
[`PROMPTS.md`](PROMPTS.md), incluindo os bugs encontrados e corrigidos durante
o processo (data do seed, especificidade de CSS, caminho do build estático).
As screenshots referenciadas ali estão em `docs/screenshots/`.

## Deploy

Deploy pensado para o Railway, com o build do React servido pelo próprio
FastAPI em uma única porta (ver `Dockerfile` na raiz do repositório). O backend
lê a porta da variável de ambiente `PORT` (padrão do Railway) e serve
`frontend/dist` automaticamente quando o diretório existe. Instruções de deploy
estão no próprio `Dockerfile` e foram validadas localmente
(`docker build` + `docker run`) antes do primeiro deploy.

## Limitações conhecidas e próximos passos

- **Sem banco de dados ainda**: estado em memória, perdido a cada reinício do
  processo — ver observação em [Arquitetura](#arquitetura). Migração para
  PostgreSQL via SQLAlchemy é o próximo passo antes da Etapa 2.
- **Sem autenticação**: o seletor de "perfil demo" substitui login nesta etapa,
  conforme escopo definido no SDD para a Etapa 1.
- **Puerpério/EPDS e conteúdo educativo**: os endpoints existem
  (`/epds`), mas ainda não têm tela dedicada — não fazem parte das 6 telas
  priorizadas nesta rodada.
- **Etapa 2 (triagem por LLM) e eventual bot de Telegram**: fora do escopo
  deste repositório; ver seções 9 e 12 do SDD.
