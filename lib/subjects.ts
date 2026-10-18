import { LESSONS } from "./lessons";
import type { Lesson, Settings, Subject } from "./types";

// ---------------------------------------------------------------------------
// DADOS DO EDITAL — SOLDADO PM-BA (FCC), edital de setembro de 2022
// Fonte: editais/EDITAL-SOLDADO-PMBA-2022-1-4vcfkq.pdf (edital verticalizado).
//
// Um tópico por item do edital, com o texto do edital (sem o ponto final).
// Itens com subitens (Direito Constitucional 1.x/2.x, Direito Penal 1.x) viram
// um tópico por subitem, prefixado pelo item-pai para não perder o contexto.
//
// A ordem importa: o progresso e os registros do banco guardam o índice do
// tópico. Reordenar ou inserir no meio desalinha o que já foi estudado.
//
// As aulas de cada matéria vêm de lib/lessons.ts.
//
// Peso padrão (o usuário pode trocar na aba Configurar): 60% pelo nº de questões
// da matéria na prova de Soldado PM-BA (FCC, jan/2023) e 40% pelo tamanho do
// conteúdo (nº de aulas), escalado para Português = 10. Só questões deixaria
// D. Constitucional (59 aulas) com o mesmo tempo de Atualidades (3 blocos).
// Ajustes sobre a conta: D. Constitucional 7,5 → 8 e Penal Militar 4,45 → 5,
// priorizando Direito; Redação (prova discursiva, sem questões) fica em 6.
//
// Prova 2023: Português 10; Matemática, História, Geografia, Atualidades e
// Informática 8 cada; as seis matérias de Direito 5 cada (80 questões).
//
// hotTopics = itens que mais caem, pelo levantamento de assuntos do TEC
// Concursos para PM-BA. Atualidades fica sem: os assuntos do levantamento
// (política e economia) não correspondem aos itens do edital.
// ---------------------------------------------------------------------------
const EDITAL: readonly Omit<Subject, "lessons">[] = [
  {
    id: "portugues",
    name: "Língua Portuguesa",
    code: "LP",
    weight: 10,
    examQuestions: 10,
    hotTopics: [0, 4, 7, 8],
    icon: "book",
    group: "gerais",
    topics: [
      "Compreensão e interpretação de textos",
      "Tipologia textual e gêneros textuais",
      "Ortografia oficial",
      "Acentuação gráfica",
      "Classes de palavras",
      "Uso do sinal indicativo de crase",
      "Sintaxe da oração e do período",
      "Pontuação",
      "Concordância nominal e verbal",
      "Regência nominal e verbal",
      "Significação das palavras",
    ],
  },
  {
    id: "matematica",
    name: "Matemática",
    code: "MAT",
    weight: 7,
    examQuestions: 8,
    hotTopics: [0, 1, 5],
    icon: "calculator",
    group: "gerais",
    topics: [
      "Conjuntos numéricos: Números Naturais, Inteiros, Racionais, Reais e Complexos (forma algébrica e forma trigonométrica). Operações, propriedades e aplicações. Sequências numéricas, progressão aritmética e progressão geométrica",
      "Álgebra: Expressões algébricas. Polinômios: operações e propriedades. Equações polinomiais e inequações relacionadas",
      "Funções: generalidades. Funções elementares: 1º grau, 2º grau, modular, exponencial e logarítmica, gráficos. Propriedades",
      "Sistemas lineares, Matrizes e Determinantes: Propriedades, aplicações",
      "Análise Combinatória: Arranjos, Permutações e Combinações simples, Binômio de Newton e Probabilidade em espaços amostrais finitos",
      "Geometria e Medidas: Geometria plana: figuras geométricas, congruência, semelhança, perímetro e área. Geometria espacial: paralelismo, perpendicularismo entre retas e planos, áreas e volumes dos sólidos geométricos: prisma, pirâmide, cilindro, cone e esfera. Geometria analítica no plano: retas, circunferência e distâncias",
      "Trigonometria: razões trigonométricas, funções, fórmulas de transformações trigonométricas, equações e triângulos",
    ],
  },
  {
    id: "informatica",
    name: "Informática",
    code: "INF",
    weight: 6,
    examQuestions: 8,
    hotTopics: [0, 1, 4],
    icon: "monitor",
    group: "gerais",
    topics: [
      "Conceitos e modos de utilização de aplicativos para edição de textos (Word, Writer), planilhas (Excel, Calc), apresentações (PowerPoint, Impress); Microsoft Office (versão 2007 e superiores), LibreOffice (versão 5.0 e superiores)",
      "Sistemas operacionais Windows 7, Windows 10 e Linux",
      "Organização e gerenciamento de informações, arquivos, pastas e programas",
      "Atalhos de teclado, ícones, área de trabalho e lixeira",
      "Conceitos básicos e modos de utilização de tecnologias, ferramentas, aplicativos e procedimentos associados à Internet e intranet",
      "Correio eletrônico",
      "Computação em nuvem",
    ],
  },
  {
    id: "historia",
    name: "História do Brasil",
    code: "HIST",
    weight: 8,
    examQuestions: 8,
    hotTopics: [1, 3, 4, 5, 6, 9],
    icon: "landmark",
    group: "gerais",
    topics: [
      "Descobrimento do Brasil (1500)",
      "Brasil Colônia (1530–1815): Capitanias Hereditárias, Economia, Extrativismo Vegetal, Extrativismo Mineral, Pecuária, Escravidão, Organização Político-Administrativa, Expansão Territorial",
      "Independência do Brasil (1822): a Nomeação do Príncipe Regente D. Pedro I, Dia do Fico, Reconhecimento da Independência do Brasil",
      "Primeiro Reinado (1822-1831)",
      "Segundo Reinado (1831-1840)",
      "Primeira República (1889-1930): o Primeiro Governo Provisório, Assembleia Constituinte, Presidência de Deodoro da Fonseca, a Política dos Governadores, o Coronelismo, Movimentos Tenentistas, Coluna Prestes, Revolta da Armada",
      "Revolução de 1930",
      "Era Vargas (1930-1945)",
      "Os Presidentes do Brasil de 1964 à atualidade",
      "História da Bahia",
      "Independência da Bahia",
      "Revolta de Canudos",
      "Revolta dos Malês",
      "Conjuração Baiana",
      "Sabinada",
    ],
  },
  {
    id: "geografia",
    name: "Geografia do Brasil",
    code: "GEO",
    weight: 6,
    examQuestions: 8,
    hotTopics: [0, 1, 4],
    icon: "map",
    group: "gerais",
    topics: [
      "Relevo brasileiro",
      "Urbanização: crescimento urbano, problemas estruturais, contingente populacional brasileiro",
      "Tipos de fontes de energia que participam da matriz energética brasileira: eólica, hidráulica, biomassa, solar e a das marés",
      "Problemas Ambientais",
      "Clima: pressão atmosférica, umidade, temperatura, fatores que determinam o clima, mudanças climáticas e as suas consequências",
      "Geografia da Bahia: aspectos políticos, físicos, econômicos, sociais e culturais",
    ],
  },
  {
    id: "atualidades",
    name: "Atualidades",
    code: "ATU",
    weight: 5,
    examQuestions: 8,
    hotTopics: [],
    icon: "newspaper",
    group: "gerais",
    topics: [
      "Globalização: conceitos, efeitos e implicações sociais, econômicas, políticas e culturais",
      "Multiculturalidade, Pluralidade e Diversidade Cultural",
      "Tecnologias de Informação e Comunicação: conceitos, efeitos e implicações sociais, econômicas, políticas e culturais",
    ],
  },
  {
    id: "dconst",
    name: "Direito Constitucional",
    code: "DCO",
    weight: 8,
    examQuestions: 5,
    hotTopics: [1, 2, 3],
    icon: "scale",
    group: "especificos",
    topics: [
      "Constituição da República Federativa do Brasil: Dos princípios fundamentais",
      "Constituição da República Federativa do Brasil: Dos Direitos e garantias fundamentais",
      "Constituição da República Federativa do Brasil: Da organização do Estado",
      "Constituição da República Federativa do Brasil: Da Administração Pública",
      "Constituição da República Federativa do Brasil: Dos militares dos Estados, do Distrito Federal e dos Territórios",
      "Constituição da República Federativa do Brasil: Da Segurança Pública",
      "Constituição do Estado da Bahia: Dos princípios fundamentais",
      "Constituição do Estado da Bahia: Direitos e garantias fundamentais",
      "Constituição do Estado da Bahia: Dos Servidores Públicos Militares",
      "Constituição do Estado da Bahia: Da Segurança Pública",
    ],
  },
  {
    id: "dh",
    name: "Direitos Humanos",
    code: "DH",
    weight: 5,
    examQuestions: 5,
    hotTopics: [0, 1],
    icon: "users",
    group: "especificos",
    topics: [
      "A Declaração Universal dos Direitos Humanos/ 1948",
      "Convenção Americana sobre Direitos Humanos/ 1969 (Pacto de São José da Costa Rica) (art. 1° ao 32)",
      "Pacto Internacional dos Direitos Econômicos, Sociais e Culturais (art. 1° ao 15)",
      "Declaração de Pequim Adotada pela Quarta Conferência Mundial sobre as Mulheres: Ação para Igualdade, Desenvolvimento e Paz",
    ],
  },
  {
    id: "dadmin",
    name: "Direito Administrativo",
    code: "DAD",
    weight: 6,
    examQuestions: 5,
    hotTopics: [0, 1, 2],
    icon: "building",
    group: "especificos",
    topics: [
      "Administração Pública",
      "Princípios fundamentais da administração pública",
      "Poderes e deveres dos administradores públicos: uso e abuso do poder, poderes vinculado, discricionário, hierárquico, disciplinar e regulamentar, poder de polícia, deveres dos administradores públicos",
      "Servidores públicos: cargo, emprego e função públicos",
      "Regime jurídico do militar estadual: Estatuto dos Policiais Militares do Estado da Bahia (Lei estadual nº 7.990, de 27 de dezembro de 2001 – arts 1º ao 59)",
    ],
  },
  {
    id: "dpenal",
    name: "Direito Penal",
    code: "DPE",
    weight: 6,
    examQuestions: 5,
    hotTopics: [0, 1, 5, 9],
    icon: "gavel",
    group: "especificos",
    topics: [
      "Do crime: Elementos",
      "Do crime: Consumação e tentativa",
      "Do crime: Desistência voluntária e arrependimento eficaz",
      "Do crime: Arrependimento posterior",
      "Do crime: Crime impossível",
      "Do crime: Causas de exclusão de ilicitude e culpabilidade",
      "Contravenção",
      "Dos crimes contra a vida (homicídio, lesão corporal, rixa)",
      "Dos crimes contra a liberdade pessoal (constrangimento ilegal, ameaça, perseguição, sequestro e cárcere privado)",
      "Dos crimes contra o patrimônio (furto, roubo, extorsão, apropriação indébita, receptação)",
      "Dos crimes contra a dignidade sexual (estupro, importunação sexual, assédio sexual)",
      "Corrupção ativa",
      "Corrupção passiva",
      "Lei n° 9.455, de 07 de abril de 1997 (Crimes de tortura)",
    ],
  },
  {
    id: "igualdade",
    name: "Igualdade Racial e de Gênero",
    code: "IRG",
    weight: 6,
    examQuestions: 5,
    hotTopics: [2, 6],
    icon: "users",
    group: "especificos",
    topics: [
      "Constituição da República Federativa do Brasil (art. 1°, 3°, 4° e 5°)",
      'Constituição do Estado da Bahia, (Cap. XXIII "Do Negro")',
      "Lei n° 12.288, de 20 de julho de 2010 (Estatuto da Igualdade Racial)",
      "Lei nº 7.716, de 5 de janeiro de 1989 (Define os crimes resultantes de preconceito de raça ou de cor) e Lei n° 9.459, de 13 de maio de 1997 (Tipificação dos crimes resultantes de preconceito de raça ou de cor)",
      "Decreto n° 65.810, de 08 de dezembro de 1969 (Convenção internacional sobre a eliminação de todas as formas de discriminação racial)",
      "Decreto n° 4.377, de 13 de setembro de 2002 (Convenção sobre a eliminação de todas as formas de discriminação contra a mulher)",
      "Lei nº 11.340, de 7 de agosto de 2006 (Lei Maria da Penha)",
      "Código Penal Brasileiro (art. 140)",
      "Lei n° 9.455, de 7 de abril de 1997 (Crime de Tortura)",
      "Lei nº 7.437, de 20 de dezembro de 1985 (Lei Caó)",
      "Lei Estadual n° 10.549, de 28 de dezembro de 2006 (Secretaria de Promoção da Igualdade Racial)",
      "Lei nº 10.678, de 23 de maio de 2003 (Secretaria de Políticas de Promoção da Igualdade Racial da Presidência da República)",
    ],
  },
  {
    id: "dpm",
    name: "Direito Penal Militar",
    code: "DPM",
    weight: 5,
    examQuestions: 5,
    hotTopics: [0, 1, 7, 8],
    icon: "shield",
    group: "especificos",
    topics: [
      "Dos crimes contra a autoridade ou disciplina militar: motim, revolta, conspiração, aliciação para motim ou revolta",
      "Da violência contra superior ou militar de serviço",
      "Desrespeito a superior",
      "Recusa de obediência",
      "Reunião ilícita",
      "Publicação ou crítica indevida",
      "Resistência mediante ameaça ou violência",
      "Dos crimes contra o serviço militar e o dever militar: deserção, abandono de posto, descumprimento de missão, embriaguez em serviço, dormir em serviço",
      "Crimes contra a Administração Militar: desacato a superior, desacato a militar, desobediência, peculato, peculato-furto, concussão",
      "Dos crimes contra o dever funcional: prevaricação",
    ],
  },
  {
    // O edital prevê a prova discursiva, mas não lista conteúdo para ela.
    id: "redacao",
    name: "Redação",
    code: "RED",
    weight: 6,
    examQuestions: 1,
    hotTopics: [],
    icon: "pen",
    group: "redacao",
    topics: ["Prova discursiva - Redação"],
  },
];

/**
 * Aulas da matéria, com um bloco de estudo para cada tópico que não tem aula
 * no curso — senão o tópico nunca entraria no ciclo. O bloco entra na posição
 * do tópico, antes da primeira aula de um tópico posterior.
 */
function lessonsFor(subject: Omit<Subject, "lessons">): Lesson[] {
  const lessons = [...(LESSONS[subject.id] ?? [])];
  const covered = new Set(lessons.flatMap((lesson) => lesson.topics));

  subject.topics.forEach((topic, topicIndex) => {
    if (covered.has(topicIndex)) return;
    const at = lessons.findIndex((lesson) => lesson.topics[0] > topicIndex);
    const selfStudy: Lesson = {
      topics: [topicIndex],
      title: topic,
      subtitle: "",
      recorded: false,
      selfStudy: true,
    };
    lessons.splice(at === -1 ? lessons.length : at, 0, selfStudy);
  });

  return lessons;
}

export const SUBJECTS: readonly Subject[] = EDITAL.map((subject) => ({
  ...subject,
  lessons: lessonsFor(subject),
}));

const SUBJECT_MAP: ReadonlyMap<string, Subject> = new Map(SUBJECTS.map((s) => [s.id, s]));

/** Retorna a matéria pelo id, ou `undefined` se o id não existir mais no edital. */
export function findSubject(id: string): Subject | undefined {
  return SUBJECT_MAP.get(id);
}

/**
 * Retorna a matéria pelo id, lançando se não existir. Use apenas onde o id
 * comprovadamente veio de `SUBJECTS` (ex.: iteração sobre a própria lista).
 */
export function getSubject(id: string): Subject {
  const subject = SUBJECT_MAP.get(id);
  if (!subject) throw new Error(`Matéria desconhecida: ${id}`);
  return subject;
}

// Índices de aula por tópico, calculados uma vez por matéria.
const lessonsByTopic = new WeakMap<Subject, number[][]>();

function indexLessons(subject: Subject): number[][] {
  let index = lessonsByTopic.get(subject);
  if (!index) {
    index = subject.topics.map(() => []);
    subject.lessons.forEach((lesson, i) => lesson.topics.forEach((t) => index![t].push(i)));
    lessonsByTopic.set(subject, index);
  }
  return index;
}

/** Aulas (índices em `subject.lessons`) que cobrem o tópico. Nunca vazio. */
export function topicLessons(subject: Subject, topicIndex: number): readonly number[] {
  return indexLessons(subject)[topicIndex] ?? [];
}

/** Posição da aula entre as do seu tópico principal: "aula 3 de 10". */
export function lessonPosition(subject: Subject, lessonIndex: number): { n: number; of: number } {
  const lesson = subject.lessons[lessonIndex];
  const siblings = topicLessons(subject, lesson.topics[0]);
  return { n: siblings.indexOf(lessonIndex) + 1, of: siblings.length };
}

/** Código de um tópico na interface: `LP-04`. */
export function topicCode(subject: Subject, topicIndex: number): string {
  return `${subject.code}-${String(topicIndex + 1).padStart(2, "0")}`;
}

export const DAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"] as const;
export const DAY_LABELS_FULL = [
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
  "Domingo",
] as const;

export const BLOCKS_PER_DAY_OPTIONS = [1, 2, 3, 4] as const;

/** Maior peso que uma matéria pode ter. */
export const MAX_WEIGHT = 10;

/** Pesos padrão das matérias, para restaurar nas configurações. */
export const DEFAULT_WEIGHTS: Readonly<Record<string, number>> = Object.fromEntries(
  SUBJECTS.map((s) => [s.id, s.weight]),
);

export const DEFAULT_SETTINGS: Settings = {
  activeDays: [1, 2, 3, 4, 5, 6],
  blocksPerDay: 3,
  weights: { ...DEFAULT_WEIGHTS },
  weightBase: {},
};
