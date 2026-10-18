# Identidade visual · mentor.ia

Referência oficial do visual do app. Antes de criar ou mudar uma tela, confira aqui.
Os valores vivem em [`app/globals.css`](app/globals.css); este documento explica o porquê.

## Direção: "Azul de missão"

Marinho profundo, um único azul royal para tudo que é ação e progresso, tipografia
geométrica com títulos pesados e um brilho azul desfocado atrás do app. A sensação é de
produto sério e moderno: uma ferramenta de estudo feita com cuidado, não um caderno improvisado.

Regras que sustentam a identidade:

1. **Um só azul de ação.** `accent` marca o que a pessoa faz ou conquista: botão, aba ativa,
   barra de progresso, perfil. Se tudo for azul, nada se destaca.
2. **Verde só para "concluído".** `success` aparece apenas no check de tópico feito.
3. **Escuro é o padrão, claro segue o sistema.** Toda cor é uma variável que troca com
   `prefers-color-scheme`; nunca use hex direto num componente (exceção: o painel `hero`, que
   é marinho nos dois temas e por isso usa branco fixo).
4. **Títulos falam alto, o resto fica quieto.** Peso 800 com letras juntas só em títulos;
   textos de apoio em `muted`, peso 500.

## Cores

| Token | Escuro | Claro | Uso |
| --- | --- | --- | --- |
| `bg` | `#070B17` | `#E9EDF6` | Fundo da página, atrás da moldura |
| `frame` | `#0D1324` | `#F6F8FC` | Moldura do app (cartão grande arredondado) |
| `surface` | `#131B30` | `#FFFFFF` | Cartões, blocos de tópico, painéis |
| `surface-alt` | `#1A2440` | `#EEF2F9` | Trilho de barras, selos discretos |
| `line` | `#25304D` | `#DFE5F0` | Bordas e divisórias |
| `ink` | `#F2F5FA` | `#0E1525` | Texto principal |
| `muted` | `#95A0B8` | `#5B6478` | Texto secundário, rótulos |
| `accent` | `#1747E0` | `#1747E0` | Fundo de botão, aba ativa, progresso |
| `accent-hover` | `#2A5BF2` | `#0F3BC4` | Hover de botão |
| `accent-text` | `#7A9BFF` | `#1747E0` | Azul usado como **texto** (legível no escuro) |
| `accent-soft` | azul 16% | `#E7EDFF` | Fundo de selos, ícones e avisos informativos |
| `on-accent` | `#FFFFFF` | `#FFFFFF` | Texto sobre `accent` |
| `success` | `#34D399` | `#0E9F6E` | Check de tópico concluído |
| `danger` | `#F47A6B` | `#C2412F` | Erros de salvamento |
| `hero` | `#0A1A4F` | `#0A1A4F` | Painel de destaque da tela de entrar |

Contraste (WCAG AA, mínimo 4.5:1 para texto): `ink`, `muted` e `accent-text` passam sobre
`bg`, `frame` e `surface` nos dois temas; branco sobre `accent` dá cerca de 7:1.

**Não use `accent` como cor de texto no escuro**: `#1747E0` sobre marinho fica ilegível.
Para texto azul, sempre `accent-text`.

## Tipografia

| Papel | Fonte | Peso / tamanho |
| --- | --- | --- |
| Títulos de tela | Plus Jakarta Sans | 800, `text-3xl`, `tracking-tight` |
| Frase de impacto (entrar) | Plus Jakarta Sans | 800, `text-5xl`, `tracking-[-0.035em]` |
| Títulos de seção, nome de tópico | Plus Jakarta Sans | 600–700 |
| Texto e rótulos | Plus Jakarta Sans | 400–500 |
| Sobrancelha (data, contexto) | Plus Jakarta Sans | 600, `text-xs`, maiúsculas, `text-accent-text` |
| Códigos de tópico (`LP-04`) | JetBrains Mono | 500, `text-[0.7rem]` |

As fontes vêm do `next/font` em [`app/layout.tsx`](app/layout.tsx) e são servidas pelo próprio
app, sem chamada ao Google em tempo de execução. Números que mudam (contadores, percentuais)
usam `tabular-nums` para não "pular" ao atualizar.

Mono serve **só** para códigos. Texto corrido em mono cansa a leitura.

## Forma e espaço

- **Raios:** moldura `rounded-3xl`; cartões e painéis `rounded-2xl`; botões, linhas de tópico e
  avisos `rounded-xl`; checkbox `rounded-lg`; chips, avatar e selos `rounded-full`.
- **Espaçamento:** escala de 4px do Tailwind. Padding de tela `p-4` no celular, `p-6` a partir de `sm`.
- **Moldura:** no celular o app ocupa a tela inteira, sem borda; a partir de `sm` vira um cartão
  com borda, `rounded-3xl` e sombra, flutuando sobre o brilho.
- **Brilho de fundo:** dois gradientes radiais fixos no `body` (azul no canto superior esquerdo,
  azul-claro no inferior direito), mais fortes no escuro.

## Componentes

- **Bloco de aula / tópico** ([`topic-block.tsx`](components/topic-block.tsx)): o bloco do ciclo
  mostra a aula (título · subtítulo da planilha) e, embaixo em `muted`, o item do edital que ela
  cobre; selos "aula 3 de 10", "não gravada" e "estudo do tópico". A área principal do
  cartão é o botão que marca o estudo do dia. Checkbox quadrado arredondado; marcado = fundo
  `success` + borda verde suave + texto `muted` (sem riscar). Código em selo `accent-soft`;
  "2ª volta" e "1ª revisão" em selo `surface-alt` ([`tag.tsx`](components/ui/tag.tsx)); "mais
  cobrado" em selo `accent-soft` com `accent-text`; revisão
  atrasada em `accent-text`, nunca em `danger` (atraso não é erro). À direita, o botão
  "Questões" (mostra o % de acerto quando há lançamentos) abre o
  [painel de questões](components/question-panel.tsx) embaixo do cartão.
- **Abas** ([`tab-nav.tsx`](components/tab-nav.tsx)): a partir de `lg`, controle segmentado no
  cabeçalho, dentro de um trilho `surface`, com a ativa em `accent` cheia. Abaixo de `lg`, barra
  fixa no rodapé com as cinco abas (ícone + nome), ativa em `accent-text` com pílula
  `accent-soft`; respeita a área da barra de gestos (`safe-area-inset-bottom`).
- **Celular:** nenhuma tela pode rolar na horizontal. Grades usam `minmax(0, 1fr)` para encolher
  abaixo do conteúdo, e os cartões se adaptam à própria largura (`@container`), não à da tela.
- **Chip** ([`chip.tsx`](components/ui/chip.tsx)): pílula; ativo = `accent` cheio.
- **Painel de número** ([`stat-panel.tsx`](components/ui/stat-panel.tsx)): ícone em quadrado
  `accent-soft`, rótulo `muted`, número 800 com `tabular-nums`, gráfico ou barra embaixo.
- **Barra de progresso:** 8px, trilho `surface-alt`, preenchimento `accent`.
- **Avatar** ([`avatar.tsx`](components/ui/avatar.tsx)): iniciais em círculo `accent`.

## Marca

O símbolo ([`logo.tsx`](components/ui/logo.tsx), [`app/icon.svg`](app/icon.svg)) é um ciclo
quase fechado com um ponto na ponta: o ciclo de estudos e "onde você parou". Versão padrão:
branco sobre quadrado `accent` com raio 16/64. Versão `bare`: só o traço, na cor do texto, para
fundos já azuis. O nome se escreve `mentor.ia`, com `.ia` em `accent-text`.

## Voz

Frases curtas e diretas, no imperativo amigo ("Escolha seu perfil para continuar de onde
parou."). Frase de impacto da tela de entrar: "A farda começa na constância." Sem exclamações
nem jargão motivacional.
