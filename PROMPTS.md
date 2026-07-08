# PROMPTS.md — Registro do processo com o agente de codificação

Este arquivo documenta a sessão de trabalho com o Claude Code (agente de
codificação) usada para construir a Etapa 1 do Gestar, conforme exigido pela
rubrica do curso (seção 8.2 do [SDD](SDD-gestar-v1.2.md)).

**Nota de transparência sobre o formato.** O plano original do SDD previa "dez
prompts incrementais, um commit ao final de cada bloco". Na prática, esta
sessão foi conduzida em **7 prompts mais amplos**, cada um cobrindo várias
mudanças relacionadas (o agente quebrou cada prompt em várias edições de
arquivo, e em alguns em um commit por bloco/tela, mas sem um commit por
sub-etapa em todos). O registro abaixo reflete o que realmente aconteceu,
prompt a prompt, incluindo os bugs encontrados pelo próprio processo de
verificação — não uma reconstrução idealizada.

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

---

## Prompt 6 — Carteira de vacinação e módulo de amamentação (SDD v1.2)

**Prompt:** "acabei de atualizar o sdd e quero nessa etapa incluir a carteira
de vacinação da gestante e os postos de amamentação." O usuário já tinha
preparado o material de origem antes de pedir: um SDD atualizado
(`SDD-gestar-v1.2.md`), o PDF oficial do Calendário Nacional de Vacinação
2026, um `.docx` da rede de bancos de leite humano (rBLH) da Fiocruz, e —
mais importante — já tinha rodado `parse_blh.py` sozinho, deixando um
`blh_unidades.json` pronto com 491 unidades (209 banco, 254 posto de coleta,
28 centro de referência), faltando só a geocodificação.

**Processo:** de novo, mudança grande e com decisões em aberto (navegação
crescendo de 6 para 8 telas, se a geocodificação — que demora 10-25 min
consultando o Nominatim — deveria rodar nesta sessão, e se o SDD deveria ser
renomeado de volta para `SDD-gestar.md`), então usei `EnterPlanMode` de novo.
Três perguntas via `AskUserQuestion` antes de escrever qualquer código:
manter 8 abas diretas (em vez de agrupar), não rodar a geocodificação agora
(o localizador funciona por UF/município enquanto isso, e ganha mapa sozinho,
sem mudança de código, quando o script rodar depois), e manter o nome
`SDD-gestar-v1.2.md` (só atualizando os links do README/PROMPTS.md).

**Resultado, em commits separados:**
1. Housekeeping: dataset BLH e scripts movidos para `backend/app/data/` e
   `scripts/` (caminhos que o SDD referencia); PDF e docx oficiais movidos
   para `design/reference/` (pequenos, mantidos versionados como fonte
   citável); `calendario_vacinal.json` criado a partir do PDF lido nesta
   sessão (conferido campo a campo contra a tabela oficial).
2. Backend: `GET/PATCH /gestantes/{id}/vacinacao`, `POST/GET
   /gestantes/{id}/amamentacao` e `GET /blh/unidades`, reaproveitando o
   padrão já existente de status calculado + override manual
   (`build_carteira`/`CARTEIRA_OVERRIDES`) em vez de inventar um novo. Alerta
   amarelo automático de dose pendente (dTpa/VSR com folga de 4 semanas) e de
   dificuldade de amamentação repetida na semana — rodado uma vez no seed,
   então o painel da equipe passou a ter `contagem.amarelo > 0` pela primeira
   vez. Tudo testado por `curl` antes de seguir para o frontend.
3. Frontend: `CarteiraVacinacao.jsx` reaproveita o componente `Timeline` já
   existente; `Amamentacao.jsx` é tela nova (orientações estáticas, registro
   de dificuldade/ordenha/doação, localizador com `navigator.geolocation` +
   fallback de UF/município, mapa `react-leaflet` condicional — só aparece se
   o backend confirmar unidades geocodificadas). `react-leaflet@5` não
   instalou (exige React 19); resolvido fixando `react-leaflet@4`, compatível
   com o React 18 já usado no projeto.

**Verificação além da leitura de código:** como o Chromium headless comum só
tira screenshot, não clica em nada, subi uma instância com
`--remote-debugging-port` e um script Python (`websocket-client`) que
conversa com o Chrome DevTools Protocol de verdade — preencheu o campo UF com
"SC", clicou no botão "Buscar" e no botão "Registrar dificuldade", e
capturou a tela depois de cada clique. A primeira tentativa de subir o
Chromium em background falhou (o processo morria assim que a chamada de
ferramenta retornava); resolvido rodando com `setsid ... & disown`, que
desacopla o processo do grupo controlado pela sessão.

## Prompt 7 — Cefaleia isolada e sintoma livre no diário

**Prompt (chegou no meio do trabalho do Prompt 6, endereçada assim que o
bloco de backend em andamento foi fechado):** "cefaleia intensa deve ser
sempre um risco de pre eclampia e acho que deve existir a possibilidade da
gestante inserir outros sintomas para que ela possa indicar para o médico."

**Resultado:** a regra em `triagem_mock.py` exigia cefaleia intensa **e**
visão embaçada **e** edema juntos para acionar vermelho; virou cefaleia
intensa sozinha (antes de 37 semanas) já ser suficiente — o SDD foi
atualizado para refletir a regra nova. O diário de sintomas ganhou um campo
de texto livre ("Outro sintoma para indicar ao médico"): o que a gestante
digitar entra na mesma lista enviada à triagem e no mesmo histórico exibido
depois, mesmo que o motor de regras não reconheça a string e não dispare
nenhum alerta automático — o objetivo é comunicação com a equipe, não
triagem automática de texto arbitrário.
