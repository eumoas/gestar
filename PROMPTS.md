# PROMPTS.md — Registro do processo com o agente de codificação

Este arquivo documenta a sessão de trabalho com o Claude Code (agente de
codificação) usada para construir a Etapa 1 do Gestar, conforme exigido pela
rubrica do curso (seção 8.2 do [SDD](SDD-gestar-v1.2.md)).

**Nota de transparência sobre o formato.** O plano original do SDD previa "dez
prompts incrementais, um commit ao final de cada bloco". Na prática, esta
sessão foi conduzida em **5 prompts mais amplos**, cada um cobrindo várias
mudanças relacionadas (o agente quebrou cada prompt em várias edições de
arquivo, e no Prompt 5 em um commit por tela, mas sem um commit por
sub-etapa nos prompts anteriores). O registro abaixo reflete o que
realmente aconteceu, prompt a prompt, incluindo os bugs encontrados pelo
próprio processo de verificação — não uma reconstrução idealizada.

**Estado de partida.** Quando esta sessão começou, já existia um scaffold
mínimo: um `backend/app/main.py` com três rotas (`/gestantes`,
`/gestantes/{id}/sintomas`, `/gestantes/{id}/jornada`) e dados em memória, um
`triagem_mock.py` com as regras de risco, e um `frontend/src/App.jsx` de
página única (sem rotas, sem menu) que listava as gestantes e tinha dois
botões para simular sintomas. Não havia navegação entre telas — o problema que
o Prompt 1 resolve.

---

## Prompt 1 — Roteamento, 6 telas e conexão com o backend

**Prompt (resumo do pedido original):** adicionar React Router ao frontend,
criar 6 páginas separadas (início da gestante, onboarding/cadastro, carteira
de pré-natal, diário de sintomas, resultado de triagem, painel da equipe),
criar um menu de navegação entre elas, conectar cada tela aos endpoints do
backend, e testar navegando em `http://localhost:5173`. O pedido situava o
trabalho na Etapa 1 do SDD, pedia um resultado "excelente" e mencionava a
intenção futura de incluir um chatbot no Telegram para lembretes.

**Resultado:**
- `react-router-dom` adicionado; `main.jsx` passou a envolver a árvore em
  `BrowserRouter` + um `GestanteProvider` (Context API) — como não há login
  nesta etapa, esse contexto guarda qual "gestante demo" está selecionada,
  persistida em `localStorage`, e é consumido por todas as telas da jornada.
- Client HTTP centralizado em `src/api.js`.
- 6 páginas criadas em `src/pages/` (`Home`, `Onboarding`, `Carteira`,
  `Diario`, `ResultadoTriagem`, `PainelEquipe`) e roteadas em `App.jsx`, com
  `NavBar` fixa no topo.
- Backend estendido com os endpoints que as novas telas precisavam e que
  ainda não existiam: `GET/PATCH /gestantes/{id}/carteira`,
  `GET /equipe/dashboard`, `PATCH /equipe/alertas/{id}`,
  `GET /gestantes/{id}/sintomas` (histórico), `GET /gestantes/{id}`.

**Ajustes feitos durante a verificação (não pedidos explicitamente, mas
necessários):**
- **Bug de dados no seed:** as datas de última menstruação (DUM) do seed
  eram fixas (2024/2025). Como o relógio do ambiente estava em 2026, todas as
  gestantes apareciam com 70–99 semanas de gestação — clinicamente
  impossível e inútil para demonstrar a carteira por trimestre. Corrigido
  para DUMs calculadas relativas à data atual (`hoje - N semanas`), então as
  gestantes ficam sempre distribuídas de forma plausível entre o 1º e o 3º
  trimestre.
- Adicionado um alerta vermelho já ativo no seed (exigência da seção 5 do
  SDD: "ao menos um caso de alerta vermelho ativo" para o painel ser
  demonstrável assim que a aplicação sobe).
- Validação de ponta a ponta feita com Chromium headless (screenshots em
  `docs/screenshots/`), não só leitura de código: naveguei pelas 6 rotas,
  registrei sintomas via `curl`, e confirmei que o alerta aparecia
  corretamente no painel da equipe.

---

## Prompt 2 — Anotar a ideia do bot de Telegram no SDD

**Prompt:** deixar uma anotação no SDD sobre a ideia do chatbot de Telegram
para lembretes de consulta e orientações.

**Resultado:** adicionada a seção 12 ("Evolução futura — fora do escopo
avaliado") ao `SDD-gestar.md`, deixando explícito que a ideia não é Etapa 1
(não é UI) nem Etapa 2 (não é o pipeline de triagem por LLM), e que precisaria
virar uma Etapa 3 documentada, com sua própria justificativa de arquitetura,
antes de entrar no código.

---

## Prompt 3 — "O design parece amador"

**Prompt:** o usuário reportou incômodo com a tipografia, dizendo que o
design parecia amador e que é muito exigente com qualidade visual.

**Diagnóstico:** o CSS declarava `font-family: Inter, ...`, mas a fonte Inter
nunca era efetivamente carregada (sem `<link>`, sem `@font-face`, sem pacote
`@fontsource`) — então todo navegador caía no fallback (`system-ui`/Arial), o
que lê como "template genérico" mesmo com o resto do layout cuidado. Essa era
a causa raiz mais provável do incômodo relatado.

**Resultado:**
- Instalado `@fontsource-variable/inter` (self-hosted, sem depender de CDN
  externa) e importado em `main.jsx`.
- Reescrita a escala tipográfica em `index.css`: tracking negativo nos
  títulos, rótulos de seção em versalete espaçado, tamanhos consistentes em
  vez dos padrões de navegador.
- Cards, inputs e botões passaram a ter sombra em duas camadas + borda sutil
  de 1px (antes só sombra, o que deixa os elementos "flutuando" sem
  nitidez), estados de foco com anel azul e transições suaves.

**Bug encontrado e corrigido durante essa mudança:** ao revisar o formulário
de cadastro, apareceu um problema de especificidade CSS pré-existente — a
regra `.form label` (que empilha rótulo e campo em coluna) tinha
especificidade maior que `.checkbox-label` e vencia o conflito, deixando as
checkboxes de "condições prévias" centralizadas de forma estranha em vez de
alinhadas à esquerda. Corrigido com uma regra mais específica
(`.form .checkbox-label`) para reafirmar o layout em linha.

---

## Prompt 4 — Trocar sangramento por cefaleia, documentação, GitHub e Railway

**Prompt:** no resultado da triagem, usar cefaleia como cenário de alerta
vermelho em vez de sangramento — o público da demonstração é predominantemente
masculino e o usuário não queria um item potencialmente constrangedor durante
uma apresentação ao vivo. Em seguida, pediu uma documentação muito detalhada
do projeto e ajuda para subir o repositório no GitHub e depois fazer o deploy
no Railway.

**Resultado (parte 1 — cefaleia):**
- Removida a opção "sangramento" do checklist do diário de sintomas
  (`Diario.jsx`); "cefaleia intensa" passou a ser a primeira opção da lista.
- A regra de sangramento **continua implementada** em `triagem_mock.py` (é
  uma regra clínica do protocolo, documentada na seção 8.1 do SDD, e
  permanece testável via API) — apenas não é mais uma opção clicável na
  interface. A ordem das regras no código foi invertida para que o cenário de
  cefaleia + visão embaçada + edema (pré-eclâmpsia) seja o caminho vermelho
  de referência, tanto no código quanto nos exemplos deste README.
- Screenshots em `docs/screenshots/` regeneradas com o novo cenário.

**Bug encontrado durante a correção anterior (regressão do Prompt 3):** ao
corrigir a especificidade do `.checkbox-label` dentro de `.form fieldset`, a
edição anterior removeu sem querer a regra genérica `.checkbox-label` usada
pelo Diário de sintomas (fora de um `<fieldset>`), deixando o texto colado no
checkbox ali. Corrigido restaurando a regra base e mantendo apenas um
override mais específico para o caso do formulário de cadastro.

**Resultado (parte 2 — bug de deploy encontrado antes de subir ao ar):** ao
preparar o projeto para rodar em produção via Railway (build único servido
pelo FastAPI), percebi que `backend/app/main.py` calculava o caminho do build
do frontend com um `.parent.parent` a menos do que o necessário — apontava
para `backend/frontend/dist` (que não existe) em vez de `frontend/dist` na
raiz do repositório. Esse bug não aparecia em desenvolvimento (Vite roda
separado, na porta 5173) e só se manifestaria no primeiro deploy. Corrigido e
validado localmente: `npm run build` + subir o FastAPI sozinho na porta 8000
serviu a aplicação completa (front + API) numa única porta, como será feito no
Railway.

**Resultado (parte 3 — documentação, GitHub e Railway):** README.md
reescrito de forma abrangente (arquitetura, como rodar, referência de API,
motor de triagem, limitações conhecidas), este PROMPTS.md criado, e
screenshots das 6 telas salvas em `docs/screenshots/`. Os passos de Git/GitHub
e deploy no Railway estão sendo conduzidos em conjunto com o usuário logo em
seguida neste mesmo documento de trabalho, já que dependem de decisões dele
(nome/visibilidade do repositório, autenticação do `gh` e do Railway) que o
agente não pode assumir sozinho.

---

## Prompt 5 — Redesign visual completo, seguindo CLAUDE-design.md

**Prompt:** depois de ver o app publicado, o usuário achou o design e as
funcionalidades "horríveis" e pediu um redesign completo, citando referências
(Stripe, Linear, Notion, Headspace Health), paleta azul `#183EFF` e stack
Tailwind + shadcn/ui. Ao tentar instalar o Tailwind, o usuário rejeitou a
ferramenta e, em seguida, apontou para um arquivo já existente no repositório,
`CLAUDE-design.md`, com uma especificação de design completamente diferente
(paleta rosé acolhedora estilo Flo/Clue/Apple Health, CSS puro com tokens,
sem Tailwind/shadcn) e pediu para eu seguir esse documento em vez do pedido
anterior — confirmado explicitamente quando perguntado.

**Processo:** como era uma mudança grande, de múltiplos arquivos, com decisões
de arquitetura em aberto, entrei em modo de planejamento (`EnterPlanMode`)
antes de escrever qualquer código. O plano identificou conflitos reais entre
os dois pedidos do usuário (paleta azul vs. rosé, Tailwind vs. CSS puro,
navegação de 4 vs. 6 abas, progresso circular vs. barra linear, intensidade de
sintoma pedida no doc mas sem campo correspondente na API) e usei
`AskUserQuestion` para resolver cada um antes de implementar, em vez de
assumir. Decisões: manter as 6 abas de navegação; usar `lucide-react` para
ícones; adicionar um campo `intensidade` opcional e aditivo na API (única
exceção à regra de "não alterar API" desta rodada, autorizada explicitamente);
seguir o CLAUDE-design.md integralmente.

**Resultado:** arquivo único de tokens (`frontend/src/styles/tokens.css`),
biblioteca de componentes base (`Card`, `CardHero`, `Chip`, `ChipSelecionavel`,
`ProgressBar`, `KpiCard`, `Timeline`/`TimelineItem`, `Button`,
`IntensityDots`, `Sparkline`) e um util de mapeamento de risco
(`lib/risco.js`) para nenhuma tela hardcodar cor ou rótulo de risco por conta
própria. Todas as 6 telas foram refeitas sobre esses componentes, com um
commit por tela (Home → Carteira → intensidade no backend → Diário → Painel
da equipe → Cadastro/Triagem), na mesma ordem sugerida pelo documento.
Nenhuma chamada de API existente mudou de contrato; a única adição foi o
campo opcional `intensidade`, testado por `curl` nos dois formatos (com e
sem o campo) para confirmar retrocompatibilidade.

**Ajuste de escopo assumido conscientemente:** o Painel da equipe pede 4
KPIs, dois dos quais ("consultas atrasadas", "exames pendentes") não existiam
como agregado em nenhum endpoint. Em vez de criar um endpoint novo (o que
extrapolaria a única exceção de API combinada), optei por calcular esses dois
números no cliente, buscando a carteira de cada gestante do dashboard via o
endpoint já existente — mais chamadas HTTP (aceitável na escala de 8
gestantes fictícias), zero mudança de contrato.

Screenshots atualizadas em `docs/screenshots/` (as anteriores, do design
azul/CSS artesanal, ficaram obsoletas e foram substituídas).
