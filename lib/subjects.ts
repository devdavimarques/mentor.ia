import type { Settings, Subject } from "./types";

// ---------------------------------------------------------------------------
// DADOS DO EDITAL — SOLDADO PM-BA (FCC)
// weight = relevância histórica (nº de questões da banca FCC no mesmo cargo)
// ---------------------------------------------------------------------------
export const SUBJECTS: readonly Subject[] = [
  {
    id: "portugues",
    name: "Língua Portuguesa",
    code: "LP",
    weight: 10,
    icon: "book",
    group: "gerais",
    topics: [
      "Compreensão e interpretação de textos",
      "Tipologia textual e gêneros textuais",
      "Ortografia oficial + Acentuação gráfica",
      "Classes de palavras",
      "Uso do sinal indicativo de crase",
      "Sintaxe da oração e do período",
      "Pontuação + Concordância nominal e verbal",
      "Regência nominal e verbal + Significação das palavras",
    ],
  },
  {
    id: "matematica",
    name: "Matemática",
    code: "MAT",
    weight: 8,
    icon: "calculator",
    group: "gerais",
    topics: [
      "Conjuntos numéricos",
      "Álgebra",
      "Funções",
      "Sistemas lineares, matrizes e determinantes",
      "Análise combinatória",
      "Geometria e medidas",
      "Trigonometria",
    ],
  },
  {
    id: "informatica",
    name: "Informática",
    code: "INF",
    weight: 8,
    icon: "monitor",
    group: "gerais",
    topics: [
      "Aplicativos de escritório (Word/Writer, Excel/Calc, PowerPoint/Impress)",
      "Sistemas operacionais (Windows 7/10, Linux) + organização de arquivos",
      "Atalhos de teclado, ícones, área de trabalho, lixeira",
      "Internet, intranet, e-mail e computação em nuvem",
    ],
  },
  {
    id: "historia",
    name: "História do Brasil",
    code: "HIST",
    weight: 9,
    icon: "landmark",
    group: "gerais",
    topics: [
      "Descobrimento do Brasil + Brasil Colônia",
      "Independência do Brasil + Primeiro Reinado",
      "Segundo Reinado + Primeira República",
      "Revolução de 1930 + Era Vargas + Presidentes de 1964 à atualidade",
      "História da Bahia + Independência da Bahia + Sabinada + Conjuração Baiana",
      "Revolta de Canudos + Revolta dos Malês",
    ],
  },
  {
    id: "geografia",
    name: "Geografia do Brasil",
    code: "GEO",
    weight: 7,
    icon: "map",
    group: "gerais",
    topics: [
      "Relevo brasileiro + Clima",
      "Urbanização + Fontes de energia",
      "Problemas ambientais + Geografia da Bahia",
    ],
  },
  {
    id: "atualidades",
    name: "Atualidades",
    code: "ATU",
    weight: 7,
    icon: "newspaper",
    group: "gerais",
    topics: [
      "Globalização",
      "Multiculturalidade, pluralidade e diversidade cultural",
      "Tecnologias de informação e comunicação",
    ],
  },
  {
    id: "dconst",
    name: "Direito Constitucional",
    code: "DCO",
    weight: 6,
    icon: "scale",
    group: "especificos",
    topics: [
      "Princípios fundamentais + Direitos e garantias fundamentais (CF)",
      "Organização do Estado + Administração Pública (CF)",
      "Militares dos Estados/DF/Territórios + Segurança Pública (CF)",
      "Constituição do Estado da Bahia (completa)",
    ],
  },
  {
    id: "dh",
    name: "Direitos Humanos",
    code: "DH",
    weight: 6,
    icon: "users",
    group: "especificos",
    topics: [
      "Declaração Universal dos Direitos Humanos/1948",
      "Convenção Americana sobre Direitos Humanos/1969 (Pacto de São José)",
      "Pacto Internacional dos Direitos Econômicos, Sociais e Culturais",
      "Declaração de Pequim",
    ],
  },
  {
    id: "dadmin",
    name: "Direito Administrativo",
    code: "DAD",
    weight: 5,
    icon: "building",
    group: "especificos",
    topics: [
      "Administração Pública + Princípios fundamentais",
      "Poderes e deveres dos administradores públicos",
      "Servidores públicos + Estatuto dos PMs da Bahia",
    ],
  },
  {
    id: "dpenal",
    name: "Direito Penal",
    code: "DPE",
    weight: 7,
    icon: "gavel",
    group: "especificos",
    topics: [
      "Do crime: elementos, consumação/tentativa, causas de exclusão",
      "Contravenção + Crimes contra a vida",
      "Crimes contra a liberdade pessoal + patrimônio",
      "Crimes contra a dignidade sexual",
      "Corrupção ativa e passiva + Lei de Tortura (9.455/1997)",
    ],
  },
  {
    id: "igualdade",
    name: "Igualdade Racial e de Gênero",
    code: "IRG",
    weight: 3,
    icon: "users",
    group: "especificos",
    topics: [
      'CF art. 1º, 3º, 4º, 5º + Constituição da Bahia (Cap. XXIII "Do Negro")',
      "Estatuto da Igualdade Racial + Leis de crimes raciais + Lei Caó",
      "Convenções internacionais (discriminação racial e contra a mulher)",
      "Lei Maria da Penha + CP art. 140 + Lei de Tortura",
      "Legislação estadual/federal de promoção da igualdade racial",
    ],
  },
  {
    id: "dpm",
    name: "Direito Penal Militar",
    code: "DPM",
    weight: 5,
    icon: "shield",
    group: "especificos",
    topics: [
      "Crimes contra autoridade/disciplina militar + violência contra superior",
      "Desrespeito a superior + recusa de obediência + reunião ilícita + resistência",
      "Crimes contra o serviço militar e o dever militar",
      "Crimes contra a Administração Militar + dever funcional",
    ],
  },
  {
    id: "redacao",
    name: "Redação",
    code: "RED",
    weight: 6,
    icon: "pen",
    group: "redacao",
    topics: [
      "Tema: Segurança pública e cidadania",
      "Tema: Direitos humanos e atuação policial",
      "Tema: Tecnologia e criminalidade",
      "Tema: Diversidade e igualdade racial/de gênero",
      "Tema: Meio ambiente e sociedade",
      "Tema: Ética no serviço público",
    ],
  },
];

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

export const DEFAULT_SETTINGS: Settings = {
  activeDays: [1, 2, 3, 4, 5, 6],
  blocksPerDay: 3,
};
