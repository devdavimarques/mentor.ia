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
   `0002_study_logs_reviews_questions.sql`, `0003_lessons.sql`, `0004_profile_passwords.sql`,
   `0005_mock_exams.sql`, `0006_flashcards.sql`, `0007_study_time_links_scores.sql` e
   `0008_flashcards_anki.sql` e `0009_review_stage_4.sql`
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
mock_exams      profile_id, title, taken_on,   Simulados: results (jsonb) é
                points_per_question, results   subjectId → feitas / certas.
study_sessions  profile_id, subject_id,        Tempo de estudo (cronômetro).
                lesson_index, minutes,
                studied_on
lesson_links    subject_id, lesson_index, url  Link de cada aula. Do curso, não de
                                               um perfil: todos veem os mesmos.
flashcards      profile_id, subject_id,        Flashcards e o agendamento da
                topic_index, front, back,      repetição espaçada.
                due_on, interval_days, ease,
                reps, lapses
```

## Aulas, progresso e revisões

- **Cada bloco do ciclo é uma aula do curso**, na ordem da planilha de gravação. As aulas estão
  em [`lib/lessons.ts`](lib/lessons.ts), cada uma ligada ao item (ou itens) do edital que
  cobre. Tópico sem aula no curso ganha um bloco de "estudo do tópico".
- **Marcar um bloco** registra que você fez aquela aula **hoje**. A marcação é do bloco: na 2ª
  volta os blocos começam desmarcados de novo.
- **Cada matéria segue a ordem do curso.** Uma aula só pode ser marcada quando é a próxima da
  matéria (as seguintes aparecem com "faça antes: …"), e a aula que você não fez vai sozinha
  para o **próximo bloco da matéria**, com as seguintes andando uma posição. As outras matérias
  não mudam. Enquanto a matéria não tem bloco livre, a aula espera na aba **Atrasadas** (com
  contador na própria aba): veja [Fila por matéria](#fila-por-matéria).
- **Progresso** = tópicos estudados. Um tópico fica estudado quando **todas as aulas dele**
  foram feitas, ou quando é marcado à mão na aba Matérias (estudo por fora).
- **Horas do dia** ([`lib/day-plan.ts`](lib/day-plan.ts)): em Configurar, o total de horas por
  dia, quanto disso é teoria (o resto é revisão) e a duração do bloco. Ex.: 4h, 2h30 de teoria e
  blocos de 50 min dão 3 blocos de teoria (aulas do ciclo, `blocksPerDay`) e 2 de revisão.
  Configurações antigas ("N blocos de 1h") viram N horas de teoria + 1h de revisão.
- **Revisões** ([`lib/reviews.ts`](lib/reviews.ts)): cada tópico estudado é revisado 2, 7, 14 e 21
  dias depois. No dia elas vêm em **blocos**, um por matéria, juntando os tópicos dela a revisar;
  marcar o bloco marca todas. A matéria de um bloco de revisão **nunca** é uma das que têm
  teoria no dia: a revisão vencida dessas espera, e o bloco puxa a de outra matéria (a mais
  atrasada primeiro; sem nada vencido, adianta a que vence mais cedo, com o selo "adiantada").
  A aba Hoje mostra teoria e revisão no mesmo quadro, cada cartão com o título "Teoria" ou
  "Revisão". Nada disso é agenda gravada: é calculado a partir dos estudos e revisões feitas,
  então desmarcar uma aula recalcula tudo.
- **Questões** são lançadas pelo botão de cada tópico (feitas / certas) e viram % de acerto por
  tópico, por matéria e no total. Não entram no progresso, mas guiam as revisões: matéria com
  tópico de **acerto abaixo de 60%** (com 5+ questões) tem prioridade nos blocos de revisão. A
  aba Progresso lista os 5 piores acertos em "Tópicos para reforçar".
- **Prova:** com a data definida em Configurar, a aba Hoje mostra quantos dias faltam e compara
  com a previsão de fim do ciclo. Se não fecha, testa até 8 blocos de teoria por dia com a mesma função que
  regera a semana (`examOutlook`, em [`lib/cycle.ts`](lib/cycle.ts)) e diz com quantos fecha.
- **Simulados:** toda semana, a cada 2 ou a cada 4 semanas (ou desligado), no dia da semana
  escolhido em Configurar. Nas semanas de simulado esse dia **fica sem blocos** (`generateWeek` distribui as
  aulas nos outros dias), e a aba Hoje lembra de fazer a prova inteira e lançar o acerto por
  matéria (a redação fica de fora). Quem quiser estudar no dia usa **Adiantar um bloco**
  (`advanceBlock`): o próximo bloco da fila vem para hoje, o resto recua uma posição e o fim do
  ciclo chega mais cedo.
- **Aba Simulados** ([`lib/mock-exams.ts`](lib/mock-exams.ts)): cada lançamento tem nome, data
  (pode ser de dias atrás) e o valor de cada questão, igual para todas — a nota sai em pontos
  (45 certas × 1,25 = 56,25 de 100). A aba mostra o gráfico das notas (em % da nota máxima,
  total ou por matéria), as **metas de acerto por matéria** (gravadas em `settings.mockTargets`,
  com "na meta" ou quantos pontos percentuais faltam no último simulado) e o histórico com a
  nota de cada matéria.
- **Cronômetro** ([`lib/study-time.ts`](lib/study-time.ts)): "Cronometrar" num bloco (ou em
  Progresso, para estudo livre) liga uma barra fixa com pausa e parada. O cronômetro ligado fica
  no navegador (sobrevive a recarregar a página); ao parar, dá para corrigir os minutos antes de
  gravar. A aba Progresso mostra o tempo por matéria na semana e no total, ao lado da fatia que o
  peso da matéria pede, e aceita lançamento à mão.
- **Links das aulas:** na aba Matérias, cada matéria tem "Aulas e links", onde se cola o link de
  cada aula (só `https://`). O link vale para todos os perfis e aparece nos blocos como "Abrir
  aula".
- **Marcar e desmarcar:** só o quadrado do check marca um bloco, uma revisão ou um tópico na
  aba Matérias; desmarcar pede confirmação, para evitar toques sem querer.
- **Sequência** ([`lib/streak.ts`](lib/streak.ts)): dias de estudo seguidos com a meta cumprida
  (pelo menos `blocksPerDay` aulas do ciclo marcadas no dia), e o recorde. Folga e dia de
  simulado não contam nem quebram; hoje só entra quando a meta é batida.
- **Evolução** ([`lib/evolution.ts`](lib/evolution.ts)): na aba Simulados, a nota em cada
  simulado (total ou por matéria); na aba Progresso, semana a semana, o edital estudado ou o
  acerto nas questões (no total ou por matéria). Cada gráfico tem tooltip e uma tabela com os mesmos números.
- **Flashcards** (aba Flashcards, [`lib/flashcards.ts`](lib/flashcards.ts)), no modelo do Anki:
  baralhos por matéria com as contagens de novos, em aprendizado e para revisar; etapas de
  aprendizado em minutos (1 e 10) antes de o cartão ir para revisão em dias; lapso leva a
  reaprendizado de 10 minutos; 8 erros tornam o cartão "sanguessuga" (suspenso). Limite diário de
  novos e de revisões (20 e 200, em Opções, gravados em `settings`). Na sessão: Espaço mostra a
  resposta e responde Bom, 1–4 respondem, Z desfaz, E edita, @ suspende. O navegador busca, filtra
  por estado e permite suspender, esquecer (voltar a novo) e apagar; as estatísticas mostram jovens
  e maduros e a previsão de revisões. Ao criar, dá para gerar também o cartão invertido. O servidor
  recalcula cada resposta a partir do cartão gravado. **Importar** baixa um modelo CSV
  ([`lib/flashcard-csv.ts`](lib/flashcard-csv.ts)) com uma linha por tópico do edital.

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
  reviews.ts          Revisões espaçadas (2, 7, 14 e 21 dias) em blocos por matéria
  day-plan.ts         Horas do dia: blocos de teoria e de revisão
  questions.ts        Estatísticas, validação das questões e tópicos de pior acerto
  mock-exams.ts       Simulados: quando cai, validação, pontos e evolução por matéria
  study-time.ts       Cronômetro: validação e tempo por matéria
  lesson-links.ts     Links das aulas: chave e validação
  flashcards.ts       Flashcards: repetição espaçada e validação
  streak.ts           Sequência de dias com a meta cumprida
  evolution.ts        Séries dos gráficos de evolução
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

### Fila por matéria

A semana guardada (jsonb `week`) tem, além dos dias, duas filas:

- `late`: blocos de semanas anteriores que ficaram sem marcar, com a semana e o dia em que
  estavam. Continuam marcáveis (o registro usa a semana original do bloco).
- `spill`: blocos empurrados para depois do fim da semana. Abrem a semana seguinte.

Cada matéria segue a ordem do curso e só anda quando a aula é feita (`relayoutSubjects`, em
[`lib/schedule.ts`](lib/schedule.ts)). As aulas ainda sem fazer da matéria (atrasadas e futuras)
são recolocadas em ordem nos lugares **dela** de hoje em diante: a aula perdida vira o próximo
bloco da matéria, as seguintes andam uma posição, e as outras matérias não mudam. Blocos marcados
não se movem; a aula que voltou à fila ganha o selo "replanejada".

- Aula atrasada sem lugar livre da matéria no resto da semana espera em `late`/no dia dela (aba
  Atrasadas) e entra no primeiro bloco da matéria na semana seguinte.
- Aula futura empurrada para fora é devolvida à matéria: o ponteiro volta e ela é gerada de novo
  no próximo bloco da matéria. `weightBase` volta junto, para o equilíbrio por peso continuar
  contando aquele bloco como entregue; sem isso a matéria atrasada ganharia blocos extras para
  "recuperar", tirando das outras. Por isso `weightBase` pode ficar negativo.
- O check de uma aula fica travado até ela ser a próxima da matéria (`nextLessons`); desmarcar
  continua livre.

Isso roda no servidor (`syncCycle`, em [`lib/cycle.ts`](lib/cycle.ts)) na primeira visita de cada
dia, junto com a virada de semana, e ao trocar configurações; só reorganiza o cronograma, então
o progresso não muda. Quando aulas atrasadas voltam à fila, o aviso "Cronograma replanejado
hoje" na aba Atrasadas mostra a previsão de fim do ciclo antes e depois.

Verificado em simulação de 3 semanas pulando toda a História: ela fica parada na 1ª aula, sem
aula perdida nem repetida, e as outras matérias andam exatamente como andariam fazendo tudo.

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
