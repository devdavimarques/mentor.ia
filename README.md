# Ciclo de Estudos · Soldado PM-BA

Aplicação Next.js que monta um **ciclo de estudos semanal ponderado** a partir do edital de
Soldado da PM-BA (banca FCC). Cada matéria recebe uma fatia de blocos proporcional ao seu peso
histórico, os blocos são espalhados ao longo da semana (em vez de agrupados) e o progresso por
tópico fica salvo no navegador.

## Stack

- **Next.js 15** (App Router) + **React 19**
- **TypeScript** em modo `strict`
- **Tailwind CSS v4** (tokens de design em `app/globals.css`)
- **lucide-react** para ícones
- Persistência em `localStorage` — sem backend, sem contas, sem dados saindo do dispositivo

## Rodando localmente

Requer **Node.js 20.9+**.

```bash
npm install
npm run dev      # http://localhost:3000
```

Outros scripts:

```bash
npm run build      # build de produção
npm run start      # sobe o build de produção
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
```

## Estrutura

```
app/                  App Router: layout, página, manifest, telas de erro
components/           Componentes de UI (todos client components)
  tabs/               Uma aba por arquivo: hoje, semana, matérias, progresso, config
  ui/                 Primitivas reutilizáveis (chip, barra de progresso)
hooks/
  use-study-cycle.ts  Estado da aplicação: carga, persistência e ações
lib/
  subjects.ts         Dados do edital (matérias, tópicos, pesos)
  schedule.ts         Geração do ciclo (maior resto + espalhamento)
  progress.ts         Cálculo de progresso e chaves de conclusão
  storage.ts          Leitura/gravação validada no localStorage
  date.ts             Helpers de data ISO (semana começando na segunda)
  types.ts            Tipos compartilhados
```

## Como o ciclo é gerado

1. `allocateSlots` reparte `dias_ativos × blocos_por_dia` entre as matérias proporcionalmente ao
   peso, **corrigindo pelo histórico já entregue**. Cada bloco vai para a matéria com o maior
   déficit em relação à fatia que ela já deveria ter recebido desde o início.
2. `spreadSlots` posiciona a i-ésima ocorrência de cada matéria perto de `i × total / count`,
   evitando que a mesma matéria caia em blocos vizinhos.
3. Cada bloco consome o **ponteiro** da matéria — o índice do próximo tópico. Quando o ponteiro
   dá a volta na lista de tópicos, o bloco é marcado como 2ª, 3ª… volta.

### Por que o histórico importa

Repartir cada semana isoladamente (maior resto, sorteio, arredondamento) distorce os pesos e
distorce **sempre na mesma direção**. Com 18 blocos para 13 matérias, quase todas ficam entre 1 e
2 blocos; os blocos que sobram caem toda semana nas mesmas matérias e o erro acumula em vez de se
compensar. Com a correção por déficit, a proporção acumulada converge para os pesos do edital:
desvio máximo de **0,27 pp em 12 semanas** e **0,06 pp em 52 semanas**.

### Regerar a semana

Trocar dias ou blocos por dia regenera o cronograma da semana atual. A semana descartada é
removida do histórico antes de gerar a nova (`pointersBeforeWeek`), então a troca **substitui** o
cronograma em vez de empurrar os ponteiros adiante — nenhum tópico é pulado, e repetir a troca N
vezes deixa o estado idêntico à primeira geração.

## Persistência

Todo o estado (`settings`, `pointers`, `week`, `completed`) vive em uma única chave versionada do
`localStorage`: `mentor-ia:study-cycle:v1`. A leitura é validada campo a campo — dados corrompidos,
de uma versão antiga ou de um navegador sem storage disponível degradam para o estado inicial em
vez de quebrar o app.

> Como o progresso é local ao navegador, limpar os dados do site zera o ciclo. Não há sincronização
> entre dispositivos.

## Deploy

O app é estático na prática (nenhuma rota de servidor, nenhuma variável de ambiente).

**Vercel** — importe o repositório; a detecção do Next.js já configura build e output.

**Qualquer host Node:**

```bash
npm ci && npm run build && npm run start
```

**Docker / container:** exponha a porta `3000` e rode `npm run start` sobre o diretório `.next`.
