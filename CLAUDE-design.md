# Design system — App de acompanhamento gestante

Este documento define o padrão visual do aplicativo. Toda tela nova ou refatorada
deve seguir estas regras. Nunca criar estilos fora dos tokens abaixo.

Referência de qualidade: apps de saúde como Flo, Clue e Apple Health.
Visual limpo, acolhedor, com hierarquia clara. Nada de bordas ASCII,
tabelas de formulário cru ou texto monoespaçado na interface.

## 1. Tokens (fonte única de verdade)

Criar um arquivo de tokens (ex.: `src/styles/tokens.css` ou equivalente no stack)
e consumir apenas ele. Nunca hardcodar cor ou espaçamento em componente.

### Cores

```css
:root {
  /* Marca */
  --primary: #D4537E;        /* rosa dessaturado, ações e destaques */
  --primary-soft: #FBEAF0;   /* fundo de cards hero e itens ativos */
  --primary-mid: #F4C0D1;    /* trilhas de progresso, fundos de ícone */
  --primary-deep: #4B1528;   /* texto sobre fundos rosa */

  /* Neutros quentes */
  --bg: #FAF8F5;             /* fundo da página */
  --surface: #FFFFFF;        /* cards */
  --text: #2C2C2A;           /* texto principal */
  --text-soft: #6B6A66;      /* texto secundário */
  --text-muted: #A3A29C;     /* dicas, itens futuros */
  --border: #ECEAE5;         /* borda sutil de 1px */

  /* Risco (usar SOMENTE em chips e indicadores de status) */
  --risk-low: #1D9E75;       /* fundo do chip: #E1F5EE, texto: #04342C */
  --risk-mid: #EF9F27;       /* fundo do chip: #FAEEDA, texto: #412402 */
  --risk-high: #E24B4A;      /* fundo do chip: #FCEBEB, texto: #501313 */
}
```

Regra: cor semântica de risco nunca decora a tela. Ela aparece apenas
em chips de status, pontos indicadores e na lista priorizada da equipe.

### Tipografia

- Fonte: Inter, system-ui ou a padrão do stack. Uma família só.
- Pesos: apenas 400 (regular) e 600 (destaque). Nada de 700+.
- Escala: 12px (legendas), 13px (secundário), 15px (corpo), 17px (título de tela), 22px (número hero, ex. "Semana 10").
- Sentence case em tudo. Nunca CAIXA ALTA, nunca Title Case.

### Espaçamento e forma

- Escala de espaçamento: múltiplos de 4px (8, 12, 16, 20, 24).
- Raio de borda: 16px em cards, 12px em cards internos, 999px em chips e barras de progresso.
- Bordas: 1px sólida var(--border), ou nenhuma (diferenciar card do fundo pela cor).
- Sem sombras pesadas. No máximo uma sombra sutil em elementos flutuantes.

## 2. Componentes base

Criar componentes reutilizáveis antes de refatorar telas:

- **Card**: fundo --surface, raio 16px, padding 16px.
- **CardHero**: fundo --primary-soft, textos em --primary-deep, contém o dado mais importante da tela.
- **Chip**: pílula (raio 999px), padding 8px 14px, ponto colorido de 8px + texto 13px peso 600.
- **ProgressBar**: trilha --primary-mid de 6px, preenchimento --primary, raio 999px.
- **KpiCard**: rótulo 12px em --text-soft acima, número 22px peso 600 abaixo, ícone opcional.
- **TimelineItem**: círculo de 22px (preenchido verde + check = concluído; preenchido --primary = atual; contorno cinza = futuro), linha vertical de 2px conectando, título 14px + subtítulo 12px ao lado.
- **ChipSelecionável**: para o diário de sintomas; estado inativo com borda, estado ativo com fundo --primary-soft e texto --primary-deep.

## 3. Regras por tela

### Home
- CardHero no topo: "Semana N" em 22px, percentual e trimestre à direita, ProgressBar, linha com ícone + "Do tamanho de um figo" + "DPP dd/mm/aaaa · faltam N semanas".
- Abaixo, grid de 2 colunas com cards de "Próxima consulta" e "Próximo exame".
- Chip de risco ("Risco habitual" / "Risco intermediário" / "Alto risco").
- Navegação inferior com 4 ícones: home, agenda, diário, equipe. Item ativo em --primary.

### Carteira da gestante
- Timeline vertical com TimelineItem. Item atual destacado com fundo --primary-soft.
- Cada item traz status e prazo ("Concluída · semana 8", "Agendar até dd/mm").

### Diário de sintomas
- Substituir formulário por chips selecionáveis com ícone por sintoma.
- Intensidade 1 a 5 como cinco bolinhas tocáveis (preenchidas até o nível escolhido).
- Gráfico temporal simples (linha ou sparkline) por sintoma nos últimos 30 dias.

### Painel da equipe
- Linha de 4 KpiCards: gestantes acompanhadas, alto risco, consultas atrasadas, exames pendentes.
- Lista de gestantes ordenada por risco, cada linha com chip de risco colorido.
- Mapa do território fica para versão futura; não bloquear o refactor por ele.

## 4. Regras de linguagem na interface

- Português claro e acolhedor, sem jargão técnico para a gestante.
- Botões começam com verbo: "Agendar consulta", "Registrar sintoma".
- Sem pontos de exclamação em mensagens do sistema.
- Datas no formato dd/mm ou "12 ago".

## 5. Processo de refatoração

1. Criar o arquivo de tokens e os componentes base primeiro. Commit.
2. Refatorar uma tela por vez, nesta ordem: Home, Carteira, Diário, Painel da equipe. Um commit por tela.
3. Nunca introduzir cor, fonte ou espaçamento fora dos tokens.
4. Ao final de cada tela, revisar contra este documento antes de seguir.
