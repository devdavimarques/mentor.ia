# Ciclo de Estudos · Soldado PM-BA

Aplicação Next.js que monta um **ciclo de estudos semanal ponderado** a partir do edital de
Soldado da PM-BA (banca FCC). Cada matéria recebe uma fatia de blocos proporcional ao seu peso
histórico, os blocos são espalhados ao longo da semana (em vez de agrupados) e cada pessoa tem
o **próprio progresso**, guardado em banco de dados.

## Stack

- **Next.js 15** (App Router) + **React 19**
- **TypeScript** em modo `strict`
- **Tailwind CSS v4** (tokens de design em `app/globals.css`)
- **lucide-react** para ícones
- **Supabase (Postgres)** como banco, acessado **apenas pelo servidor**

## Configuração inicial

Requer **Node.js 20.9+**.

### 1. Instalar dependências

```bash
npm install
```

### 2. Criar o projeto no Supabase

1. Crie um projeto em [supabase.com](https://supabase.com) (o plano gratuito basta)
2. Abra **SQL Editor** e execute, nesta ordem, cada arquivo de
   [`supabase/migrations/`](supabase/migrations/): `0001_init.sql`,
   `0002_study_logs_reviews_questions.sql`, `0003_lessons.sql`, `0004_profile_passwords.sql` e
   `0005_mock_exams.sql`
3. Vá em **Settings → API** e copie `Project URL` e a chave `service_role`

### 3. Configurar as variáveis de ambiente

```bash
cp .env.example .env.local
```

Preencha `.env.local` com os dois valores do passo anterior — e **salve o arquivo**.

Tanto `.env` quanto `.env.local` funcionam (o Next.js e o `db:seed` leem os dois, com
`.env.local` tendo precedência). Ambos já estão no `.gitignore`.

> A chave `service_role` ignora todas as regras de segurança do banco. Ela **nunca** pode receber
> o prefixo `NEXT_PUBLIC_` nem ser commitada.

### 4. Criar os perfis

Não existe cadastro público: as contas são criadas por linha de comando.

```bash
npm run db:seed -- "Nome Um" "Nome Dois"
```

Rodar de novo com os mesmos nomes não duplica nada. Nomes novos são acrescentados.

### 5. Rodar

```bash
npm run dev      # http://localhost:3000
```

Outros scripts:

```bash
npm run build      # build de produção
npm run start      # sobe o build de produção
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
```

## Usuários e acesso

A tela `/entrar` lista os perfis do banco. Tocar num perfil abre o campo de senha; o botão com o
nome no cabeçalho sai do perfil.

**Senha por perfil.** Definida (ou trocada) pela linha de comando — não existe tela de cadastro:

```bash
npm run db:password -- "Davi"
```

A senha é pedida sem aparecer na tela e vai para o banco só como hash scrypt com sal
([`lib/password.ts`](lib/password.ts)). Perfil sem senha não consegue entrar. Senha errada
espera 0,6 s antes de responder, para deixar tentativa em massa lenta.

**Sessão assinada.** O cookie (`httpOnly`, um ano) leva o id do perfil e um HMAC do id com o hash
da senha, com chave derivada da `SUPABASE_SERVICE_ROLE_KEY` ([`lib/session.ts`](lib/session.ts)).
Ninguém monta o cookie à mão a partir do id, e **trocar a senha encerra as sessões abertas** do
perfil. Toda requisição confere a assinatura com o hash atual.

**Visitante.** "Entrar como visitante" abre um ciclo de exemplo, gerado na hora, em que dá para
mexer em tudo — mas nada é enviado ao servidor, e recarregar a página volta ao início. Não é só
a interface: toda Server Action de gravação exige um perfil autenticado, e visitante não é um.

O que **é** garantido: o progresso de cada perfil é isolado no banco. Toda tabela de registro
tem `profile_id` e toda leitura e escrita filtra por ele, então marcar algo num perfil nunca
afeta o outro.

## Modelo de dados

```
profiles        id, name                       As pessoas. Criadas pelo seed.
study_states    profile_id, settings,          Um por perfil. settings/pointers/week
                pointers, week                 são jsonb (documentos, não colunas).
study_logs      profile_id, subject_id,        Um estudo num dia: de uma aula (lesson_index,
                lesson_index | topic_index,    bloco do ciclo em week_start + lap) ou de um
                studied_on, week_start, lap    tópico marcado à mão (topic_index).
review_logs     profile_id, subject_id,        Revisões feitas (1ª, 2ª, 3ª).
                topic_index, stage, done_on
question_logs   profile_id, subject_id,        Lançamentos de questões: feitas / certas.
                topic_index, answered,
                correct, logged_on
mock_exams      profile_id, taken_on,          Simulados: results (jsonb) é
                results                        subjectId → feitas / certas.
```

## Aulas, progresso e revisões

- **Cada bloco do ciclo é uma aula do curso**, na ordem da planilha de gravação. As aulas estão
  em [`lib/lessons.ts`](lib/lessons.ts), cada uma ligada ao item (ou itens) do edital que
  cobre. Tópico sem aula no curso ganha um bloco de "estudo do tópico".
- **Marcar um bloco** registra que você fez aquela aula **hoje**. A marcação é do bloco: na 2ª
  volta os blocos começam desmarcados de novo.
- **Aula atrasada não some.** Bloco de um dia que já passou e ficou sem marcar aparece na aba
  **Atrasadas** (com contador na própria aba), inclusive depois da virada de semana, até ser
  feito. Com **3 dias de estudo** de atraso (folga não conta), o cronograma se replaneja
  sozinho; o botão **Replanejar ciclo** faz isso na hora para todas: veja
  [Replanejamento](#replanejamento-de-aulas-atrasadas).
- **Progresso** = tópicos estudados. Um tópico fica estudado quando **todas as aulas dele**
  foram feitas, ou quando é marcado à mão na aba Matérias (estudo por fora).
- **Revisões** vencem 1, 7 e 30 dias depois de o tópico ficar estudado e aparecem na aba Hoje
  até serem feitas (atrasadas ficam marcadas). Uma revisão nunca vence no mesmo dia da
  anterior. Nada disso é agenda gravada: é calculado em [`lib/reviews.ts`](lib/reviews.ts) a
  partir dos estudos e revisões feitas, então desmarcar uma aula recalcula tudo.
- **Questões** são lançadas pelo botão de cada tópico (feitas / certas) e viram % de acerto por
  tópico, por matéria e no total. Não entram no progresso, mas guiam as revisões: tópico com
  **acerto abaixo de 60%** (com 5+ questões) revisa em **1, 3 e 14 dias** em vez de 1, 7 e 30,
  com o selo "reforço". A aba Progresso lista os 5 piores acertos em "Tópicos para reforçar".
- **Prova:** com a data definida em Configurar, a aba Hoje mostra quantos dias faltam e compara
  com a previsão de fim do ciclo. Se não fecha, testa 4 blocos por dia com a mesma função que
  regera a semana (`examOutlook`, em [`lib/cycle.ts`](lib/cycle.ts)) e diz com quantos fecha.
- **Simulados:** a cada 2 ou 4 semanas (ou desligado), no dia da semana escolhido em
  Configurar. Nas semanas de simulado esse dia **fica sem blocos** (`generateWeek` distribui as
  aulas nos outros dias), e a aba Hoje lembra de fazer a prova inteira e lançar o acerto por
  matéria (a redação fica de fora). Quem quiser estudar no dia usa **Adiantar um bloco**
  (`advanceBlock`): o próximo bloco da fila vem para hoje, o resto recua uma posição e o fim do
  ciclo chega mais cedo. A aba Progresso mostra o histórico e a variação de cada matéria em
  relação ao simulado anterior; dá para lançar avulso por lá também.
- **Marcar e desmarcar:** só o quadrado do check marca um bloco ou revisão; desmarcar pede
  confirmação, para evitar toques sem querer.

As matérias, os tópicos do edital e as aulas **não** estão no banco: são dados estáticos em
[`lib/subjects.ts`](lib/subjects.ts) e [`lib/lessons.ts`](lib/lessons.ts), versionados junto
com o código. O banco guarda só posições (índice do tópico, índice da aula), então reordenar ou
inserir itens no meio dessas listas desalinha o que já foi registrado.

### De onde vêm os dados

- **Tópicos:** edital verticalizado em `editais/EDITAL-SOLDADO-PMBA-2022-1-4vcfkq.pdf`, um tópico
  por item (subitens viram tópicos próprios).
- **Aulas:** os vídeos da pasta "1. Curso Online 2026 (ORGANIZADO)" do Drive (lida em
  18/10/2026), só as subpastas das matérias do edital e o conteúdo de Soldado. Um vídeo = uma
  aula. Os casos em que a pasta não bate com o edital estão comentados no topo de
  [`lib/lessons.ts`](lib/lessons.ts). A planilha de gravação em `editais/planilha-aulas/` foi a
  primeira fonte e está desatualizada.

## Segurança do acesso ao banco

O navegador nunca fala com o Supabase. Todo acesso passa pelo servidor do Next.js usando a
`service_role`, e a arquitetura é travada em três pontos:

1. Os módulos `lib/db/*`, `lib/env.ts`, `lib/password.ts`, `lib/session.ts` e `lib/study-session.ts` importam
   `server-only` — o build **falha** se algum componente de cliente tentar importá-los
2. As tabelas têm **RLS ligado e nenhuma policy**, então a chave pública (`anon`) não lê nem
   escreve nada, mesmo que vaze
3. Mutação só por **Server Actions**, que revalidam toda entrada (matéria existe, índice dentro
   da faixa, configurações válidas) antes de tocar no banco

Verificado no build: `0` ocorrências de `supabase`, `service_role` ou `createClient` nos chunks
enviados ao navegador.

## Estrutura

```
app/
  page.tsx            Carrega o ciclo do perfil (server component)
  entrar/page.tsx     Seleção de perfil
  actions.ts          Server Actions: perfil, blocos, revisões, questões, config
components/           Componentes de UI
  tabs/               Uma aba por arquivo: hoje, semana, atrasadas, matérias, progresso, config
  ui/                 Primitivas reutilizáveis (chip, barra de progresso, selo)
  question-panel.tsx  Lançamento e histórico de questões de um tópico
hooks/
  use-study-cycle.ts  Estado no cliente: atualização otimista + reconciliação
lib/
  db/                 Acesso ao Postgres (server-only)
  subjects.ts         Dados do edital (matérias, tópicos, pesos)
  lessons.ts          Aulas do curso, ligadas aos tópicos do edital
  schedule.ts         Geração do ciclo (déficit acumulado + espalhamento), atrasos e replanejamento
  cycle.ts            Previsão de fim do ciclo + manutenção do dia (virada e replanejamento)
  progress.ts         Tópicos vistos, blocos marcados e percentuais
  reviews.ts          Revisões espaçadas (1, 7 e 30 dias)
  questions.ts        Estatísticas, validação das questões e tópicos de pior acerto
  mock-exams.ts       Simulados: quando cai, validação e evolução por matéria
  state-schema.ts     Validação do jsonb do banco e das entradas das actions
  session.ts          Cookie do perfil (server-only)
  study-session.ts    Perfil corrente + carga do ciclo do dia (server-only)
  date.ts             Datas ISO no fuso do app (semana começando na segunda)
supabase/
  migrations/         SQL do schema
scripts/
  seed-profiles.mjs   Criação dos perfis
  set-password.mjs    Senha de um perfil (npm run db:password)
```

## Pesos das matérias

O peso (0 a 10) define a fatia de blocos de cada matéria e pode ser trocado na aba Configurar;
peso 0 tira a matéria do ciclo. O padrão, em [`lib/subjects.ts`](lib/subjects.ts), combina:

- **60%: questões na prova** de Soldado PM-BA (FCC, jan/2023): Português 10; Matemática,
  História, Geografia, Atualidades e Informática 8 cada; as seis matérias de Direito 5 cada.
- **40%: tamanho do conteúdo** (nº de aulas). Só questões daria a D. Constitucional (59 aulas) o
  mesmo tempo de Atualidades (3 blocos).

Escalado para Português = 10, com dois ajustes priorizando Direito (D. Constitucional 7,5 → 8 e
Penal Militar 4,45 → 5) e Redação, que não tem questões objetivas, em 6.

Os tópicos que mais caem (levantamento de assuntos do TEC Concursos para PM-BA) levam o selo
**mais cobrado** nos blocos e na aba Matérias.

## Como o ciclo é gerado

1. `allocateSlots` reparte `dias_ativos × blocos_por_dia` entre as matérias proporcionalmente ao
   peso, **corrigindo pelo histórico já entregue**. Cada bloco vai para a matéria com o maior
   déficit em relação à fatia que ela já deveria ter recebido desde a última troca de pesos
   (`weightBase`) — sem isso, aumentar um peso depois de meses faria a matéria tomar a semana
   inteira para "recuperar" o atraso.
2. `spreadSlots` posiciona a i-ésima ocorrência de cada matéria perto de `i × total / count`,
   evitando que a mesma matéria caia em blocos vizinhos.
3. Cada bloco consome o **ponteiro** da matéria — o índice da próxima aula. Quando o ponteiro
   dá a volta na lista de aulas, o bloco é marcado como 2ª, 3ª… volta. O ponteiro anda quando a
   aula **entra no cronograma**, não quando é feita: o que fica para trás é cuidado pelos
   atrasados e pelo replanejamento, nunca por reemitir a aula.
4. Os blocos que vieram de antes (empurrados para além do fim da semana anterior) ocupam os
   **primeiros** lugares da semana; só o resto recebe aulas novas.

### Por que o histórico importa

Repartir cada semana isoladamente (maior resto, sorteio, arredondamento) distorce os pesos e
distorce **sempre na mesma direção**. Com 18 blocos para 13 matérias, quase todas ficam entre 1 e
2 blocos; os blocos que sobram caem toda semana nas mesmas matérias e o erro acumula em vez de se
compensar. Com a correção por déficit, a proporção acumulada converge para os pesos do edital:
desvio máximo de **0,27 pp em 12 semanas** e **0,06 pp em 52 semanas**.

### Replanejamento de aulas atrasadas

A semana guardada (jsonb `week`) tem, além dos dias, duas filas:

- `late`: blocos de semanas anteriores que ficaram sem marcar, com a semana e o dia em que
  estavam. Continuam marcáveis (o registro usa a semana original do bloco).
- `spill`: blocos empurrados para depois do fim da semana. Abrem a semana seguinte.

Quando uma aula sem fazer chega a **3 dias de estudo de atraso** (`REPLAN_AFTER_STUDY_DAYS`), ela
sai do dia em que estava e vira o **primeiro bloco livre de hoje** (ou do próximo dia de estudo).
Todos os blocos não marcados que vinham depois andam uma posição; o que passa do fim da semana
vai para `spill`. Blocos já marcados não se movem. A aula replanejada ganha o selo
"replanejada" e, se ficar de novo 3 dias sem fazer, volta outra vez para a fila.

Isso roda no servidor (`syncCycle`, em [`lib/cycle.ts`](lib/cycle.ts)) na primeira visita do dia
em que for necessário, junto com a virada de semana, e é gravado.

O botão **Replanejar ciclo**, na aba Atrasadas (`replanCycleAction`), faz o mesmo na hora com
**todas** as atrasadas, sem esperar os 3 dias. Ele só reorganiza o cronograma: os registros de
estudo, os blocos marcados e os ponteiros não mudam, então o progresso continua igual.

Nos dois casos, o aviso "Cronograma replanejado hoje" na aba Atrasadas mostra a previsão de fim
do ciclo antes e depois.

### Previsão de fim do ciclo

`projectCycleEnd` segue o cronograma como está (semana atual de hoje em diante, `spill` e semanas
simuladas com as mesmas funções que geram as de verdade) até a última aula da volta em curso da
matéria mais atrasada. Atrasados ainda não replanejados contam como feitos a tempo; quando entram
na fila, a previsão anda. Aparece nas abas Hoje e Progresso.

### Regerar a semana

Trocar dias, blocos por dia ou pesos regenera o cronograma **de hoje em diante**; os dias que já
passaram ficam como estão. As aulas ainda sem fazer no fim da sequência de cada matéria voltam
para ela e são distribuídas de novo; o resto (marcadas, vindas de outra semana, replanejadas)
fica na fila, na ordem. Nenhuma aula é pulada nem repetida, e repetir a troca N vezes deixa o
estado idêntico à primeira.

### Virada de semana e fuso horário

A semana nova é gerada no servidor, na primeira visita da semana. Como a Vercel roda em
UTC, o app fixa o fuso em `America/Bahia` ([`lib/date.ts`](lib/date.ts)) e o servidor manda a data
de hoje já resolvida para o cliente — sem isso, a aba "Hoje" mostraria o dia errado de madrugada.

## Salvamento

Toda alteração aparece na tela na hora e é enviada ao banco em seguida. Se a gravação falhar, o
estado anterior é restaurado e um aviso aparece no topo — nada de achar que salvou algo perdido.

Mudanças de configuração são recalculadas **no servidor**: o navegador manda só a preferência,
nunca o cronograma pronto. O cliente calcula o mesmo resultado localmente com as mesmas funções
puras para não esperar a ida e volta, e depois reconcilia com o que o servidor gravou.

## Deploy

**Vercel** — importe o repositório e cadastre as duas variáveis em *Settings → Environment
Variables*:

| Variável | Valor |
| --- | --- |
| `SUPABASE_URL` | Project URL do Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | chave `service_role` |

As rotas `/` e `/entrar` são renderizadas sob demanda (leem cookie e banco), então não há nada a
pré-gerar.

**Qualquer host Node:**

```bash
npm ci && npm run build && npm run start
```

Exporte as mesmas duas variáveis no ambiente antes de subir.
