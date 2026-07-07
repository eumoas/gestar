# SDD — Gestar
## Documento de Design de Software
### Companheira de gestação e puerpério para o SUS

**Versão:** 1.0
**Autora:** Miriam
**Contexto:** Curso de IA Generativa (Pós-graduação em IA Aplicada, UniSENAI/FIESC)
**Entregas:** Avaliação Intermediária (20/02, 30 pontos) e Avaliação Final (26/02, 70 pontos)

---

## 1. Introdução

### 1.1 Propósito

Este documento especifica o design do Gestar, uma plataforma de acompanhamento da
gestação e do puerpério inspirada na jornada da Caderneta da Gestante do Ministério
da Saúde. O documento cobre as duas etapas de entrega do curso: a Etapa 1 constrói
toda a interface e estrutura da aplicação com respostas simuladas onde a IA atuará,
e a Etapa 2 integra IA generativa com decisões de engenharia de LLM documentadas.

### 1.2 Escopo do problema

O Brasil registra mortes maternas evitáveis em número incompatível com a cobertura
da atenção primária. A Caderneta da Gestante, principal instrumento de acompanhamento
do pré-natal no SUS, permanece em papel na maior parte dos territórios. Equipes de
saúde da família acompanham dezenas de gestantes com pouca visibilidade sobre sinais
de alerta entre consultas. O Gestar propõe uma jornada digital para a gestante e um
painel de acompanhamento territorial para a equipe, com triagem de sinais de alerta
apoiada por IA na versão final.

### 1.3 Referências

- Protocolo de pré-natal do Ministério da Saúde (consultas mínimas e exames por trimestre).
- Rede de Atenção Materna e Infantil (Rede Alyne), política pública de referência.
- Escala de Depressão Pós-parto de Edimburgo (EPDS).
- Rubricas das avaliações intermediária (30 pontos) e final (70 pontos) do curso.

### 1.4 Princípios de segurança do protótipo

Todos os dados são fictícios, gerados por seed. A aplicação exibe aviso permanente de
que se trata de protótipo acadêmico e não substitui atendimento médico. Na Etapa 1,
toda devolutiva é rotulada como resposta simulada. Na Etapa 2, decisões de risco
vermelho nunca dependem exclusivamente do LLM: regras determinísticas têm precedência.

---

## 2. Visão geral do sistema

O sistema tem dois perfis de usuário. A gestante registra sua jornada em interface
mobile-first: onboarding com cálculo de idade gestacional, carteira de pré-natal com
checklist por trimestre, diário de sintomas com triagem, fluxo de puerpério com EPDS
e conteúdo educativo semanal. A equipe de saúde acessa um painel desktop com semáforo
de risco do território, fila de alertas e detalhe por gestante.

Na Etapa 1, a triagem e as respostas personalizadas são simuladas por um motor de
regras determinístico isolado em um serviço próprio. Na Etapa 2, esse serviço é
substituído por um pipeline de LLM com ferramentas e RAG, mantendo o mesmo contrato
de interface. Essa substituibilidade é uma decisão central de arquitetura.

---

## 3. Divisão em etapas

### Etapa 1 — Avaliação Intermediária (20/02, 30 pontos)

Escopo: aplicação completa de UI, navegável de ponta a ponta, sem nenhum modelo de IA.
Entregáveis: endpoint público funcional, repositório GitHub com commits incrementais,
README documentando o processo com o agente de codificação.

Fora de escopo nesta etapa: qualquer chamada a LLM, autenticação real, dados reais.

### Etapa 2 — Avaliação Final (26/02, 70 pontos)

Escopo: substituição do serviço de triagem simulada por integração real com LLM,
incluindo system prompt versionado, ferramentas (tools), RAG sobre o protocolo do
Ministério da Saúde, parâmetros justificados e estrutura de repositório com pastas
prompts/, tools/ e agents/. Entregáveis: repositório atualizado, README focado em
decisões de engenharia de LLM, apresentação oral de 3 minutos.

A Etapa 2 é um anexo evolutivo da Etapa 1: a UI não muda, muda o motor por trás do
contrato de triagem. O histórico de commits deixará essa transição visível, o que
fortalece a narrativa nas duas avaliações.

---

## 4. Arquitetura

### 4.1 Stack

- Backend: Python 3.12, FastAPI, SQLAlchemy 2 (ORM), Pydantic v2.
- Frontend: React 18 + Vite, mobile-first, recharts para visualizações.
- Banco de dados: PostgreSQL 16.
- Etapa 2: extensão pgvector no mesmo PostgreSQL para embeddings do RAG.
- Deploy: build do React servido como estático pelo FastAPI (porta única),
  exposição via ngrok; banco em serviço gerenciado com camada gratuita
  (Neon ou Supabase), o que mantém o endpoint acessível de qualquer lugar.

### 4.2 Justificativa do PostgreSQL

O professor recomenda SQLite pela simplicidade, e essa recomendação é válida para a
Etapa 1 isoladamente. A escolha por PostgreSQL se justifica pela visão das duas etapas
como um único produto:

1. Na Etapa 2, o RAG usa pgvector, o que mantém dados relacionais e vetoriais no mesmo
   banco, sem introduzir um vector store separado. Essa simplificação é um argumento
   de arquitetura para a rubrica final (critério 4, arquitetura e framework).
2. Campos semiestruturados (itens do diário de sintomas, respostas do EPDS) usam JSONB
   com indexação, adequado a dados clínicos de esquema variável.
3. O painel da equipe usa agregações por território e janela temporal, cenário em que
   o PostgreSQL se comporta melhor sob acesso concorrente de dois perfis.
4. Continuidade profissional: o padrão de mercado em aplicações de saúde e em pipelines
   de LLM em produção é PostgreSQL, e o projeto integra o portfólio da autora.

Mitigação do custo de complexidade: docker-compose com um único serviço de banco para
desenvolvimento local, e string de conexão via variável de ambiente. Como o acesso é
todo via SQLAlchemy, existe fallback documentado para SQLite caso o ambiente de
demonstração exija (troca de uma variável, sem alteração de código).

### 4.3 Componentes

```
frontend (React/Vite)
   │  REST/JSON
   ▼
backend (FastAPI)
   ├── routers/        gestante, equipe, triagem, conteudo
   ├── services/
   │     ├── triagem_contract.py   (interface comum às duas etapas)
   │     ├── triagem_mock.py       (Etapa 1: motor de regras)
   │     └── triagem_llm.py        (Etapa 2: pipeline LLM + tools + RAG)
   ├── data/protocolo_ms.json
   └── db (SQLAlchemy) ──► PostgreSQL (+ pgvector na Etapa 2)
```

O contrato de triagem recebe o contexto da gestante e o registro de sintomas e devolve
nível de risco, mensagem e ações sugeridas. Etapa 1 e Etapa 2 implementam o mesmo
contrato, e um flag de configuração seleciona a implementação ativa.

---

## 5. Modelo de dados (PostgreSQL)

- usuarios (id, nome, perfil ENUM gestante|equipe)
- gestacoes (id, gestante_id FK, dum DATE, dpp DATE, paridade, condicoes_previas JSONB,
  status ENUM gestacao|puerperio)
- consultas (id, gestacao_id FK, tipo, trimestre, data_prevista, data_realizada, status)
- exames (id, gestacao_id FK, nome, trimestre, status, resultado_ficticio)
- sintomas (id, gestacao_id FK, data, itens JSONB, intensidade)
- alertas (id, gestacao_id FK, origem ENUM regra|llm, nivel ENUM verde|amarelo|vermelho,
  mensagem, tratado BOOLEAN, criado_em TIMESTAMPTZ)
- epds_respostas (id, gestacao_id FK, data, respostas JSONB, pontuacao)
- conteudos (id, semana, titulo, corpo)
- Etapa 2: conteudo_embeddings (id, fonte, trecho TEXT, embedding VECTOR)

Seed: 8 a 10 gestantes fictícias em fases distintas da jornada, incluindo ao menos um
caso de alerta vermelho ativo, para que o painel da equipe seja demonstrável no minuto
de verificação da Aula 6.

---

## 6. Design da API

Rotas principais (REST/JSON):

- POST /gestantes (onboarding, calcula DPP e idade gestacional)
- GET /gestantes/{id}/jornada (linha do tempo consolidada)
- GET/PATCH /gestantes/{id}/carteira (consultas e exames por trimestre)
- POST /gestantes/{id}/sintomas (registra e dispara triagem via contrato)
- POST /gestantes/{id}/epds (pontua e dispara triagem)
- GET /equipe/dashboard (semáforo do território, filtros por trimestre e risco)
- GET /equipe/alertas e PATCH /equipe/alertas/{id} (fila e tratamento)
- GET /conteudos?semana=n
- Etapa 2: POST /gestantes/{id}/pergunta (dúvida livre respondida pelo pipeline LLM)

---

## 7. Interface

Perfil gestante (mobile-first): seleção de perfil demo, onboarding, home com linha do
tempo, carteira de pré-natal com progresso por trimestre, diário de sintomas, card de
resultado da triagem, fluxo de puerpério com EPDS, conteúdo da semana.

Perfil equipe (desktop): dashboard do território com semáforo, fila de alertas com ação
de tratamento, detalhe da gestante com gráfico temporal de sintomas e, na Etapa 2,
resumo pré-consulta gerado pelo LLM.

São mais de dez telas, dois fluxos de usuário e formulários dinâmicos, atendendo o
critério de complexidade da Etapa 1.

---

## 8. Etapa 1 em detalhe

### 8.1 Motor de triagem simulada (triagem_mock.py)

Regras determinísticas vestidas de IA, com atraso artificial e rótulo visível de
resposta simulada:

- Cefaleia intensa + visão embaçada + edema antes de 37 semanas: vermelho (padrão
  compatível com pré-eclâmpsia), orientação de procurar UBS ou maternidade.
- Sangramento em qualquer fase: vermelho.
- Contrações regulares antes de 37 semanas: vermelho.
- EPDS maior ou igual a 13: vermelho; entre 10 e 12: amarelo, com mensagem acolhedora.
- Demais combinações: verde ou amarelo com orientações de autocuidado.

### 8.2 Fluxo de trabalho com o agente de codificação

Dez prompts incrementais no Claude Code, um commit ao final de cada bloco, registro
integral em PROMPTS.md (prompt, resultado, ajustes). Sequência: scaffold com
docker-compose do PostgreSQL; modelos e seed; protocolo_ms.json fornecido pela autora;
onboarding; home e carteira; diário e triagem mock; puerpério e EPDS; painel da equipe;
polimento visual e acessibilidade; deploy e README.

### 8.3 Mapeamento na rubrica da Etapa 1

Endpoint funcional (8): porta única FastAPI + estáticos, banco gerenciado, teste por
colega antes da entrega. Complexidade (6): dois perfis, mais de dez telas, visão clara
da integração futura descrita no README. Repositório (4): commits por bloco, estrutura
da seção 4.3, .gitignore para Python, Node e variáveis de ambiente. README (8): quatro
seções da rubrica alimentadas pelo PROMPTS.md. Uso do agente (4): PROMPTS.md e
screenshots das sessões.

---

## 9. Etapa 2 em detalhe — engenharia de LLM

### 9.1 Escolha de modelo

Estratégia de dupla implementação com justificativa de trade-offs, conforme exigido:

- Caminho principal: API da Anthropic (Claude Sonnet) via SDK oficial, pela qualidade
  de tool calling e pela confiabilidade de saídas estruturadas em português.
- Caminho alternativo documentado: modelo local via Ollama (qwen3 ou gpt-oss:20b) com
  endpoint compatível, para o cenário sem orçamento e com requisito de privacidade,
  relevante em contexto de dados de saúde no SUS.

O README documenta o que se perde no caminho local (consistência de tool calling,
qualidade de português clínico, janelas de contexto) e o que se ganha (custo zero,
privacidade, soberania do dado), atendendo diretamente a exigência da rubrica.

### 9.2 Framework

Chamadas diretas via SDK, sem LangChain. Justificativa: o fluxo tem um único agente,
três a quatro ferramentas e um passo de RAG; um framework de orquestração adicionaria
camadas de abstração sem benefício proporcional, e o SDK mantém visível cada decisão
(prompt, parâmetros, loop de tools), o que favorece a arguição oral. O trade-off
(reimplementar o loop de ferramentas manualmente) é assumido e documentado.

### 9.3 System prompt (prompts/system_prompt.txt)

Estrutura em blocos com tags XML: persona (assistente de apoio ao pré-natal do SUS,
tom acolhedor, linguagem simples, sem jargão); restrições (nunca diagnostica, nunca
prescreve, sempre orienta procurar a equipe de saúde em sinais de alerta, responde
somente com base no contexto recuperado); formato de saída (JSON com nivel, mensagem,
acoes, fontes); few-shot com dois exemplos de triagem (um verde, um vermelho) e um
exemplo de recusa (pergunta fora do escopo materno-infantil). O arquivo é versionado
e cada iteração relevante vira commit, evidenciando refinamento (critério 1, 18 pontos).

### 9.4 Ferramentas (tools/)

- buscar_protocolo(consulta): RAG sobre protocolo_ms.json e conteúdos educativos,
  via pgvector. Existe para ancorar respostas em fonte oficial e reduzir alucinação
  clínica.
- consultar_historico(gestacao_id): retorna idade gestacional, condições prévias e
  sintomas recentes. Existe porque a triagem depende de contexto longitudinal, não
  apenas do registro do dia.
- registrar_alerta(gestacao_id, nivel, justificativa): grava alerta para a equipe.
  Existe para fechar o ciclo assistencial, com regra dura: nível vermelho por regra
  determinística nunca pode ser rebaixado pelo LLM.
- calcular_idade_gestacional(dum): função utilitária determinística, exposta como
  ferramenta para evitar aritmética de datas pelo modelo.

Cada ferramenta tem descrição orientada ao modelo, parâmetros tipados via JSON Schema
e tratamento de erro com mensagem estruturada de retorno.

### 9.5 Parâmetros

- Triagem e resumo clínico: temperatura 0.2, saída estruturada. Justificativa:
  consistência e reprodutibilidade em contexto sensível.
- Conteúdo educativo semanal: temperatura 0.7. Justificativa: variedade de linguagem
  sem exigência de determinismo.
- Experimentação documentada: tabela no README comparando comportamento em
  temperaturas 0, 0.2 e 0.7 sobre um conjunto fixo de cinco casos de teste, ligando
  o projeto à experiência da autora com desenho de indicadores e avaliação.

### 9.6 RAG

Justificativa de necessidade (e não apenas uso): respostas sobre pré-natal precisam
citar o protocolo oficial; sem recuperação, o modelo tende a generalizar a partir de
fontes não brasileiras. Pipeline: chunking do protocolo e dos conteúdos, embeddings
armazenados em pgvector, top-k por similaridade, trechos injetados no prompt com
instrução de citar a fonte. A escolha do PostgreSQL na Etapa 1 antecipou esta decisão.

### 9.7 Segurança e input malicioso

Resposta preparada para a arguição: entrada do usuário demarcada em bloco próprio do
prompt com instrução explícita de tratá-la como dado; validação Pydantic da saída
estruturada com fallback para mensagem segura; regras determinísticas com precedência
sobre o LLM em qualquer decisão de risco; recusa padrão para temas fora do escopo.

### 9.8 Mapeamento na rubrica da Etapa 2

System prompt e prompting (18): seção 9.3. Tools (14): seção 9.4. Parâmetros (10):
seção 9.5 com evidência de experimentação. Arquitetura e framework (10): seções 9.1,
9.2 e 9.6. README (10): estrutura espelhando as cinco subseções da rubrica, com
diagrama do fluxo input, prompt, modelo, tools, resposta. Apresentação (8): roteiro
de 3 minutos com 30 segundos de problema, 2 minutos de decisões de LLM e 30 segundos
de aprendizados, ensaiado com as perguntas prováveis da seção 9.7.

---

## 10. Riscos e mitigações

- Banco gerenciado indisponível no dia da verificação: fallback SQLite documentado
  e testado (troca de variável de ambiente).
- Estouro de escopo na Etapa 1: as telas de conteúdo educativo são as únicas
  candidatas a corte sem comprometer a rubrica.
- Dependência de API paga na Etapa 2: caminho Ollama testado como plano B.
- Tema sensível (saúde mental perinatal): linguagem revisada pela autora, rótulos de
  simulação, avisos permanentes e ausência de dados reais.

## 11. Cronograma

- Sessões 1 e 2: fundação (scaffold, banco, seed, protocolo) e fluxo completo da
  gestante. Sessões 3 e 4: painel da equipe, polimento, deploy e README da Etapa 1.
- Após a entrega intermediária: sessão 5 para pipeline LLM e tools; sessão 6 para RAG
  e experimentos de parâmetros; sessão 7 para README final e ensaio do pitch.

## 12. Evolução futura (fora do escopo avaliado)

Ideia registrada para depois da Etapa 2, ainda sem compromisso de entrega nem mapeamento
de rubrica: um bot no Telegram para enviar lembretes de consultas/exames da carteira de
pré-natal e orientações da gestante às gestantes. Não é Etapa 1 (não há UI a construir)
nem Etapa 2 (não é o pipeline de triagem por LLM), então, se for adiante, deve virar uma
Etapa 3 explícita e documentada — com sua própria justificativa de arquitetura (ex.:
job/worker que lê `carteira` e `conteudos` e chama a API do Telegram), em vez de
misturado silenciosamente às entregas já definidas.
