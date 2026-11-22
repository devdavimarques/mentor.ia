// ---------------------------------------------------------------------------
// LINKS DE QUESTÕES E MATERIAIS POR TÓPICO — gerado da planilha
// "Planilha de Estudos PMBA (Hub).xlsx" (aba template_tutory), lida em 22/11/2026.
//
// Cada tópico do edital (código do app, ex. LP-07) tem uma ou mais linhas da
// planilha: o nome do assunto, o link de questões no QConcursos (já filtrado
// por banca e assunto) e o material de apoio no Drive, quando há.
// `LESSON_RESOURCE` diz qual linha vale para cada aula (`subjectId:índice`).
// Não edite à mão: se a planilha mudar, gere o arquivo de novo a partir dela.
// ---------------------------------------------------------------------------

export interface TopicResource {
  /** Assunto como está na planilha. */
  name: string;
  /** Questões no QConcursos. */
  questions: string | null;
  /** Material de apoio no Drive (PDF, documento ou pasta). */
  material: string | null;
}

export const TOPIC_RESOURCES: Readonly<Record<string, readonly TopicResource[]>> = {
  "LP-01": [
    {
      "name": "Compreensão e interpretação de textos - Parte única",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?discipline_ids%5B%5D=1&examining_board_ids%5B%5D=1&examining_board_ids%5B%5D=63&examining_board_ids%5B%5D=152&examining_board_ids%5B%5D=189&per_page=20&scholarity_ids%5B%5D=2&sort=newest&subject_ids%5B%5D=14655&subject_ids%5B%5D=19271",
      "material": "https://drive.google.com/file/d/1skBxXdcRtUjPT4GHeShNQZzjwN7RCmFh/view?usp=drive_link"
    }
  ],
  "LP-02": [
    {
      "name": "Compreensão e interpretação de textos/ Tipologia textual e gêneros textuais.",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?discipline_ids%5B%5D=1&examining_board_ids%5B%5D=1&examining_board_ids%5B%5D=63&examining_board_ids%5B%5D=152&examining_board_ids%5B%5D=189&per_page=20&scholarity_ids%5B%5D=2&sort=newest&subject_ids%5B%5D=14655&subject_ids%5B%5D=19271",
      "material": "https://drive.google.com/file/d/1skBxXdcRtUjPT4GHeShNQZzjwN7RCmFh/view?usp=drive_link"
    }
  ],
  "LP-03": [
    {
      "name": "Ortografia",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?discipline_ids%5B%5D=1&examining_board_ids%5B%5D=1&examining_board_ids%5B%5D=63&examining_board_ids%5B%5D=152&examining_board_ids%5B%5D=189&per_page=20&scholarity_ids%5B%5D=2&sort=newest&subject_ids%5B%5D=14621&subject_ids%5B%5D=25201&subject_ids%5B%5D=25204",
      "material": "https://drive.google.com/file/d/1JqErumLkIWNIHr9N_MhJplBbgYzUhZ7g/view?usp=sharing"
    }
  ],
  "LP-04": [
    {
      "name": "Acentuação gráfica",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?discipline_ids%5B%5D=1&examining_board_ids%5B%5D=1&examining_board_ids%5B%5D=63&examining_board_ids%5B%5D=152&examining_board_ids%5B%5D=189&per_page=20&scholarity_ids%5B%5D=2&sort=newest&subject_ids%5B%5D=14621&subject_ids%5B%5D=25201&subject_ids%5B%5D=25202",
      "material": null
    }
  ],
  "LP-05": [
    {
      "name": "Classes de palavras",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?discipline_ids%5B%5D=1&exclude_nullified=true&exclude_outdated=true&per_page=5&scholarity_ids%5B%5D=2&subject_ids%5B%5D=14630",
      "material": "https://drive.google.com/file/d/19d4dgTKEPhm2GfTqG6ImsBlDtEJekZoW/view?usp=drive_link"
    }
  ],
  "LP-06": [
    {
      "name": "Uso do sinal indicativo de crase",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?notebook_ids%5B%5D=14491322",
      "material": "https://drive.google.com/file/d/1r5Pmvy4R60nr0C8PQr9rPB40hspruFdI/view?usp=drive_link"
    }
  ],
  "LP-07": [
    {
      "name": "Sintaxe da oração (transitividade verbal, tipos de sujeito, termos integrantes, termos acessórios e vozes verbais",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?discipline_ids%5B%5D=1&exclude_nullified=true&exclude_outdated=true&per_page=5&q=transitividade&scholarity_ids%5B%5D=2&sort=newest",
      "material": null
    },
    {
      "name": "Sintaxe da oração (Período Composto)",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?notebook_ids%5B%5D=14491329",
      "material": "https://drive.google.com/file/d/1LAoGGLHv1CPbjKlXIn7XZNei07ZcZMak/view?usp=drive_link"
    }
  ],
  "LP-08": [
    {
      "name": "Pontuação",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?notebook_ids%5B%5D=14491334",
      "material": "https://drive.google.com/file/d/18AK1FUCTd971RHvY5q7esEI45rQzGFMY/view?usp=drive_link"
    }
  ],
  "LP-09": [
    {
      "name": "Concordância vebal e nominal",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?discipline_ids%5B%5D=1&exclude_nullified=true&exclude_outdated=true&per_page=20&scholarity_ids%5B%5D=2&sort=most_difficult&subject_ids%5B%5D=16012",
      "material": "https://drive.google.com/file/d/1l6_zTQ2PH-Ep7-73_NSpZ9iYcrU4pFmw/view?usp=drive_link"
    }
  ],
  "LP-10": [
    {
      "name": "Regência nominal",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?notebook_ids%5B%5D=14491362",
      "material": null
    },
    {
      "name": "Regência verbal",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?notebook_ids%5B%5D=14491363",
      "material": "https://drive.google.com/file/d/18khkQjTpyys4KJWPiE9IRXFZo5YBdlCQ/view?usp=drive_link"
    }
  ],
  "LP-11": [
    {
      "name": "Significação das Palavras",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?notebook_ids%5B%5D=14491376",
      "material": null
    }
  ],
  "MAT-01": [
    {
      "name": "Conjuntos numéricos: Números Naturais, Inteiros, Racionais, Reais e Complexos (forma algébrica e forma trigonométrica). operações, propriedades e aplicações pt01",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?notebook_ids%5B%5D=14491841",
      "material": null
    },
    {
      "name": "Porcentagem",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?discipline_ids%5B%5D=13&exclude_nullified=true&exclude_outdated=true&per_page=5&scholarity_ids%5B%5D=2&sort=newest&subject_ids%5B%5D=20321",
      "material": null
    },
    {
      "name": "Frações",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?discipline_ids%5B%5D=13&exclude_nullified=true&exclude_outdated=true&per_page=5&scholarity_ids%5B%5D=2&sort=newest&subject_ids%5B%5D=20316",
      "material": null
    },
    {
      "name": "Razão e proporção",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?discipline_ids%5B%5D=13&exclude_nullified=true&exclude_outdated=true&per_page=5&scholarity_ids%5B%5D=2&sort=newest&subject_ids%5B%5D=20317",
      "material": null
    },
    {
      "name": "Regra de três",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?discipline_ids%5B%5D=13&exclude_nullified=true&exclude_outdated=true&per_page=5&scholarity_ids%5B%5D=2&sort=newest&subject_ids%5B%5D=20319",
      "material": null
    },
    {
      "name": "Sequências numéricas",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?notebook_ids%5B%5D=14491841",
      "material": null
    },
    {
      "name": "Progressão Aritmétricas",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?discipline_ids%5B%5D=13&exclude_nullified=true&exclude_outdated=true&per_page=5&scholarity_ids%5B%5D=2&sort=newest&subject_ids%5B%5D=18902",
      "material": "https://drive.google.com/file/d/1XViM8YadgbLI-vm02DXMsYhWQA7B2z6k/view?usp=drive_link"
    },
    {
      "name": "Progressão Geométricas",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?discipline_ids%5B%5D=13&exclude_nullified=true&exclude_outdated=true&per_page=5&scholarity_ids%5B%5D=2&sort=newest&subject_ids%5B%5D=18903",
      "material": null
    }
  ],
  "MAT-02": [
    {
      "name": "Equações do 1º e 2° grau.",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?notebook_ids%5B%5D=14491888",
      "material": null
    },
    {
      "name": "Sistemas de equações",
      "questions": null,
      "material": null
    },
    {
      "name": "Álgebra: Expressões algébricas. Polinômios: operações e propriedades. Equações polinomiais e inequações relacionadas.",
      "questions": null,
      "material": "https://drive.google.com/file/d/1Uu1P8lwTSIkIbitOfUXAn7CInjoh1PmX/view?usp=drive_link"
    },
    {
      "name": "Razão e proporção",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?discipline_ids%5B%5D=13&exclude_nullified=true&exclude_outdated=true&per_page=5&scholarity_ids%5B%5D=2&sort=newest&subject_ids%5B%5D=20317",
      "material": null
    }
  ],
  "MAT-03": [
    {
      "name": "Função do 1º grau",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?discipline_ids%5B%5D=13&exclude_nullified=true&exclude_outdated=true&per_page=5&scholarity_ids%5B%5D=2&sort=newest&subject_ids%5B%5D=14556",
      "material": "https://docs.google.com/document/d/1xluCoX2Qn1G3N63byq93-N-ETXZBeJPb/edit?usp=drive_link&ouid=108414710559103394344&rtpof=true&sd=true"
    },
    {
      "name": "Função do 2º grau",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?discipline_ids%5B%5D=13&exclude_nullified=true&exclude_outdated=true&per_page=5&scholarity_ids%5B%5D=2&sort=newest&subject_ids%5B%5D=14557",
      "material": "https://docs.google.com/document/d/1P0xTw5Amn3Y3rHhN8OD-qOtOh126DEqj/edit?usp=drive_link&ouid=108414710559103394344&rtpof=true&sd=true"
    },
    {
      "name": "Funções: Modular",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?notebook_ids%5B%5D=14491888",
      "material": "https://docs.google.com/document/d/1qZb6ef5DEo1gDXLIofWAxNyYng3nfC5B/edit?usp=drive_link&ouid=108414710559103394344&rtpof=true&sd=true"
    },
    {
      "name": "Funções: Exponencial",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?notebook_ids%5B%5D=14491888",
      "material": "https://docs.google.com/document/d/1-bSOrxcl2idnzRPTpUiUL686ddSFz4pc/edit?usp=drive_link&ouid=108414710559103394344&rtpof=true&sd=true"
    },
    {
      "name": "Funções: Logarítmica",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?notebook_ids%5B%5D=14491888",
      "material": "https://docs.google.com/document/d/11sOHb2TLvpUx7t0e7wxa8N4CiAIsCY4y/edit?usp=drive_link&ouid=108414710559103394344&rtpof=true&sd=true"
    }
  ],
  "MAT-04": [
    {
      "name": "Sistemas lineares, Matrizes e Determinantes: Propriedades, aplicações aula 01",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?notebook_ids%5B%5D=14491905",
      "material": "https://docs.google.com/document/d/1JMtKyf4pAahQCOlzQThIjJOiELhRKVGX/edit?usp=drive_link&ouid=108414710559103394344&rtpof=true&sd=true"
    }
  ],
  "MAT-05": [
    {
      "name": "Probabilidade",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?discipline_ids%5B%5D=13&exclude_nullified=true&exclude_outdated=true&per_page=5&scholarity_ids%5B%5D=2&sort=newest&subject_ids%5B%5D=14568",
      "material": null
    },
    {
      "name": "Análise Combinatória: Arranjos, Permutações e Combinações simples, Binômio de Newton e Probabilidade em espaços amostrais finitos. Aula 01",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?notebook_ids%5B%5D=14491913",
      "material": "https://drive.google.com/file/d/1AfOvs9O2MQscMFwfwzlQscuTNysD5V_G/view?usp=drive_link"
    },
    {
      "name": "Binômio de Newton - Parte única",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?discipline_ids%5B%5D=13&exclude_nullified=true&exclude_outdated=true&subject_ids%5B%5D=14569",
      "material": null
    }
  ],
  "MAT-06": [
    {
      "name": "Geometria e Medidas: Geometria plana: figuras geométricas, congruência, semelhança, perímetro e área. Geometria espacial: paralelismo, perpendicularismo entre retas e planos, áreas e volumes dos sólidos geométricos: prisma, pirâmide, cilindro, cone e esfera. Geometria analítica no plano: retas, circunferência e distâncias. Aula 01",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?notebook_ids%5B%5D=14491920",
      "material": "https://drive.google.com/file/d/1R3c8fE3gra8-FYDtGrJjFKFqj_j8vcOt/view?usp=drive_link"
    }
  ],
  "MAT-07": [
    {
      "name": "Trigonometria: razões trigonométricas, funções, fórmulas de transformações trigonométricas, equações e triângulos.",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?notebook_ids%5B%5D=14491929",
      "material": "https://docs.google.com/document/d/1wWbfH23zFh27ImwFxZFKaRf3mZmVa3wx/edit?usp=drive_link&ouid=108414710559103394344&rtpof=true&sd=true"
    }
  ],
  "INF-01": [
    {
      "name": "Office e LibreOffice.",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?discipline_ids%5B%5D=46&examining_board_ids%5B%5D=1&examining_board_ids%5B%5D=63&examining_board_ids%5B%5D=152&examining_board_ids%5B%5D=189&exclude_nullified=true&exclude_outdated=true&per_page=20&scholarity_ids%5B%5D=2&sort=newest&subject_ids%5B%5D=1102&subject_ids%5B%5D=2961&subject_ids%5B%5D=16711&subject_ids%5B%5D=18405",
      "material": null
    }
  ],
  "INF-02": [
    {
      "name": "Sistemas operacionais Windows 7, Windows 10 e Linux.",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?discipline_ids%5B%5D=46&examining_board_ids%5B%5D=1&examining_board_ids%5B%5D=63&examining_board_ids%5B%5D=152&examining_board_ids%5B%5D=189&exclude_nullified=true&exclude_outdated=true&per_page=20&scholarity_ids%5B%5D=2&sort=newest&subject_ids%5B%5D=8123&subject_ids%5B%5D=19793",
      "material": "https://drive.google.com/file/d/1hrCk4uw3pnYRGlvm9hv56COBGw9u1njw/view"
    }
  ],
  "INF-03": [
    {
      "name": "Organização e gerenciamento de informações, arquivos, pastas e programas.",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?discipline_ids%5B%5D=46&examining_board_ids%5B%5D=1&examining_board_ids%5B%5D=63&examining_board_ids%5B%5D=152&examining_board_ids%5B%5D=189&exclude_nullified=true&exclude_outdated=true&per_page=20&scholarity_ids%5B%5D=2&sort=newest&subject_ids%5B%5D=3597",
      "material": "https://drive.google.com/file/d/1WKwEyNm3P_CVhh7HEkXItBTNOTZDPWvr/view?usp=sharing"
    }
  ],
  "INF-04": [
    {
      "name": "Atalhos de teclado, ícones, área de trabalho e lixeira.",
      "questions": "https://www.qconcursos.com/questoes-militares/questoes?discipline_ids%5B%5D=46&per_page=20&sort=newest&subject_ids%5B%5D=6298",
      "material": "https://drive.google.com/file/d/1dCKsCXtAnlSCCX-b_yKkd9aKiHiAZbJF/view?usp=sharing"
    }
  ],
  "INF-05": [
    {
      "name": "Rede de computadores",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?discipline_ids%5B%5D=46&exclude_nullified=true&exclude_outdated=true&per_page=5&scholarity_ids%5B%5D=2&sort=newest&subject_ids%5B%5D=324",
      "material": null
    }
  ],
  "INF-06": [
    {
      "name": "Correio eletrônico.",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?discipline_ids%5B%5D=46&examining_board_ids%5B%5D=1&examining_board_ids%5B%5D=63&examining_board_ids%5B%5D=152&examining_board_ids%5B%5D=189&exclude_nullified=true&exclude_outdated=true&per_page=20&scholarity_ids%5B%5D=2&sort=newest&subject_ids%5B%5D=241&subject_ids%5B%5D=27964",
      "material": "https://drive.google.com/file/d/1uy2l5qFg0swIB25tXuT5x9tv6s-h7lvO/view?usp=sharing"
    }
  ],
  "INF-07": [
    {
      "name": "Computação em nuvem.",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?discipline_ids%5B%5D=46&examining_board_ids%5B%5D=1&examining_board_ids%5B%5D=63&examining_board_ids%5B%5D=152&examining_board_ids%5B%5D=189&exclude_nullified=true&exclude_outdated=true&per_page=20&scholarity_ids%5B%5D=2&sort=newest&subject_ids%5B%5D=11846",
      "material": "https://drive.google.com/file/d/1yPhBXCu8j7yIJPa9lAG5ekgpqLhPmdbJ/view?usp=sharing"
    }
  ],
  "HIST-01": [
    {
      "name": "Descobrimento",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?discipline_ids%5B%5D=550&exclude_nullified=true&exclude_outdated=true&per_page=5&q=descobrimento%20do%20brasil&sort=newest&subject_ids%5B%5D=14902&subject_ids%5B%5D=14903",
      "material": "https://docs.google.com/document/d/1RA3AVkSGij1HHMMAGd2KEKb_EWz8wv7b/edit?usp=drive_link&ouid=108414710559103394344&rtpof=true&sd=true"
    }
  ],
  "HIST-02": [
    {
      "name": "Brasil Colônia",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?discipline_ids%5B%5D=550&exclude_nullified=true&exclude_outdated=true&per_page=5&sort=newest&subject_ids%5B%5D=14905",
      "material": "https://docs.google.com/document/d/1RA3AVkSGij1HHMMAGd2KEKb_EWz8wv7b/edit?usp=drive_link&ouid=108414710559103394344&rtpof=true&sd=true"
    }
  ],
  "HIST-03": [
    {
      "name": "Independência do Brasil (1822)",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?notebook_ids%5B%5D=14491522",
      "material": "https://drive.google.com/file/d/17ZEcwA-tIkkhCxJRtMNfWC8E52grPvBG/view?usp=drive_link"
    }
  ],
  "HIST-04": [
    {
      "name": "Primeiro Reinado",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?notebook_ids%5B%5D=14491542",
      "material": "https://drive.google.com/file/d/17ZEcwA-tIkkhCxJRtMNfWC8E52grPvBG/view?usp=drive_link"
    }
  ],
  "HIST-05": [
    {
      "name": "Segundo Reinado",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?discipline_ids%5B%5D=550&exclude_nullified=true&exclude_outdated=true&per_page=5&scholarity_ids%5B%5D=2&sort=newest&subject_ids%5B%5D=16598",
      "material": null
    }
  ],
  "HIST-06": [
    {
      "name": "Primeira República",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?discipline_ids%5B%5D=550&exclude_nullified=true&exclude_outdated=true&per_page=5&scholarity_ids%5B%5D=2&sort=newest&subject_ids%5B%5D=14910",
      "material": null
    }
  ],
  "HIST-07": [
    {
      "name": "Era vargas",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?notebook_ids%5B%5D=14491593",
      "material": "https://drive.google.com/file/d/11YIpcvIxkTwLCzvmTmuTWzHe6ZlsQUvP/view?usp=drive_link"
    }
  ],
  "HIST-08": [
    {
      "name": "Era vargas",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?notebook_ids%5B%5D=14491593",
      "material": "https://drive.google.com/file/d/11YIpcvIxkTwLCzvmTmuTWzHe6ZlsQUvP/view?usp=drive_link"
    }
  ],
  "HIST-09": [
    {
      "name": "Os Presidentes do Brasil de 1964 à atualidade",
      "questions": "https://www.qconcursos.com/questoes-militares/questoes?discipline_ids%5B%5D=550&exclude_nullified=true&exclude_outdated=true&per_page=5&sort=newest&subject_ids%5B%5D=14918&subject_ids%5B%5D=14919&subject_ids%5B%5D=14920&subject_ids%5B%5D=14921",
      "material": "https://docs.google.com/document/d/1oTBojzDgLRmMGEamDUPFzGk2WAMOXNLQ/edit?usp=drive_link&ouid=108414710559103394344&rtpof=true&sd=true"
    }
  ],
  "HIST-10": [
    {
      "name": "História da Bahia",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?notebook_ids%5B%5D=14491708",
      "material": "https://docs.google.com/document/d/1xbmCp0ewtpTgrL6mufqu3N234XjhiaKI/edit?usp=drive_link&ouid=108414710559103394344&rtpof=true&sd=true"
    }
  ],
  "HIST-11": [
    {
      "name": "História da Bahia",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?notebook_ids%5B%5D=14491708",
      "material": "https://docs.google.com/document/d/1xbmCp0ewtpTgrL6mufqu3N234XjhiaKI/edit?usp=drive_link&ouid=108414710559103394344&rtpof=true&sd=true"
    }
  ],
  "HIST-12": [
    {
      "name": "História da Bahia",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?notebook_ids%5B%5D=14491708",
      "material": "https://docs.google.com/document/d/1xbmCp0ewtpTgrL6mufqu3N234XjhiaKI/edit?usp=drive_link&ouid=108414710559103394344&rtpof=true&sd=true"
    }
  ],
  "HIST-13": [
    {
      "name": "História da Bahia",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?notebook_ids%5B%5D=14491708",
      "material": "https://docs.google.com/document/d/1xbmCp0ewtpTgrL6mufqu3N234XjhiaKI/edit?usp=drive_link&ouid=108414710559103394344&rtpof=true&sd=true"
    }
  ],
  "HIST-14": [
    {
      "name": "História da Bahia",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?notebook_ids%5B%5D=14491708",
      "material": "https://docs.google.com/document/d/1xbmCp0ewtpTgrL6mufqu3N234XjhiaKI/edit?usp=drive_link&ouid=108414710559103394344&rtpof=true&sd=true"
    }
  ],
  "HIST-15": [
    {
      "name": "História da Bahia",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?notebook_ids%5B%5D=14491708",
      "material": "https://docs.google.com/document/d/1xbmCp0ewtpTgrL6mufqu3N234XjhiaKI/edit?usp=drive_link&ouid=108414710559103394344&rtpof=true&sd=true"
    }
  ],
  "GEO-01": [
    {
      "name": "Relevo brasileiro",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?notebook_ids%5B%5D=14491732",
      "material": "https://drive.google.com/file/d/1E8EKJ5nYHaTJMn7UdwT_ltEihKfJRmSA/view?usp=drive_link"
    }
  ],
  "GEO-02": [
    {
      "name": "Urbanização: crescimento urbano, problemas estruturais, contingente populacional brasileiro aula 1",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?notebook_ids%5B%5D=14491758",
      "material": "https://drive.google.com/file/d/1DhorGkjMwMoROb9IbRVkZNyksHp7sww3/view?usp=drive_link"
    }
  ],
  "GEO-03": [
    {
      "name": "Tipos de fontes de energia que participam da matriz energética brasileira: eólica, hidráulica, biomassa, solar e a das marés aula 1",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?notebook_ids%5B%5D=14491766",
      "material": "https://drive.google.com/file/d/1uCF0Ey6gtW-zmUT2qO0Uen79j2ZepOAP/view?usp=drive_link"
    }
  ],
  "GEO-04": [
    {
      "name": "Problemas Ambientais.",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?notebook_ids%5B%5D=14491775",
      "material": "https://docs.google.com/document/d/1BLCF7OxrGZG9W0d7hzj0-YXoQ1gRCBM0/edit?usp=drive_link&ouid=108414710559103394344&rtpof=true&sd=true"
    }
  ],
  "GEO-05": [
    {
      "name": "Clima: pressão atmosférica, umidade, temperatura, fatores que determinam o clima, mudanças climáticas e as suas consequências pt 1",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?notebook_ids%5B%5D=14491784",
      "material": "https://docs.google.com/document/d/1ZfwST9bPwQ0xu3w4YLrNZf6yhzTUXifK/edit?usp=drive_link&ouid=108414710559103394344&rtpof=true&sd=true"
    }
  ],
  "GEO-06": [
    {
      "name": "Geografia da Bahia: aspectos políticos, físicos, econômicos, sociais e culturais.",
      "questions": "https://www.qconcursos.com/questoes-militares/disciplinas/historia-historia-e-geografia-de-estados-e-municipios/historia-e-geografia-do-estado-da-bahia/questoes?utm_source=midia_paga&utm_medium=google_pmax&utm_campaign=qconcursos_acq_alwayson_pmax&gad_source=1&gad_campaignid=20200684311&gbraid=0AAAAAD42MG1PtIRXYZAk64hEyf_qmgUpU&gclid=CjwKCAjwyOzSBhBTEiwAmxvJ-v-LSKRGtvpRiQGMKhgGI4-2z4y24VaZlYSNUhBMtMe4WSowgiNH-xoCVUMQAvD_BwE",
      "material": "https://drive.google.com/file/d/1FwW4aFq-YnX6OhlLjyciejZDrc9EpDXy/view?usp=drive_link"
    }
  ],
  "DCO-01": [
    {
      "name": "Dos princípios fundamentais",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?notebook_ids%5B%5D=14492334",
      "material": "https://drive.google.com/file/d/1nFU74-w_fKm8fqG2dgUmk4jQOYzLLWlf/view?usp=sharing"
    }
  ],
  "DCO-02": [
    {
      "name": "Direitos e Garantias Fundamentais (Teoria Geral)",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?notebook_ids%5B%5D=14492344",
      "material": "https://drive.google.com/file/d/1hBk3lapidVGC11n6Budi3C5BccAtJOgz/view?usp=drive_link"
    },
    {
      "name": "Direitos e Garantias Fundamentais (Direitos Individuais e Coletivos)",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?notebook_ids%5B%5D=14492344",
      "material": "https://drive.google.com/file/d/1hBk3lapidVGC11n6Budi3C5BccAtJOgz/view?usp=sharing"
    },
    {
      "name": "Direitos e Garantias Fundamentais (Remédios Constitucionais)",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?notebook_ids%5B%5D=14492344",
      "material": "https://drive.google.com/file/d/1ycqWqiun6dfxPKqYImfmlYP2-XCEel-H/view?usp=drive_link"
    },
    {
      "name": "Direitos e Garantias Fundamentais (Direitos Sociais)",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?notebook_ids%5B%5D=14492344",
      "material": null
    },
    {
      "name": "Direitos e Garantias Fundamentais (Nacionalidade)",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?notebook_ids%5B%5D=14492344",
      "material": "https://drive.google.com/file/d/15QIeSX7zI6PJQfxsl2G43mbgB41Kt3s2/view?usp=drive_link"
    },
    {
      "name": "Direitos e Garantias Fundamentais (Direitos Políticos)",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?notebook_ids%5B%5D=14492344",
      "material": null
    },
    {
      "name": "Direitos e Garantias Fundamentais (Partidos Políticos",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?notebook_ids%5B%5D=14492344",
      "material": null
    }
  ],
  "DCO-03": [
    {
      "name": "Da Organização do Estado (Disposições Gerais)",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?notebook_ids%5B%5D=14492344",
      "material": "https://drive.google.com/file/d/13SUB6uGTkzUJdcOQAsDAti7tGcqTrhHh/view?usp=sharing"
    }
  ],
  "DCO-04": [
    {
      "name": "Da Organização do Estado (Da Administração Pública)",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?notebook_ids%5B%5D=14492344",
      "material": "https://drive.google.com/file/d/12LRhId_mkCbsr6NSGb3zakSZyNbnl0gU/view?usp=drive_link"
    }
  ],
  "DCO-06": [
    {
      "name": "Da Segurança Pública",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?notebook_ids%5B%5D=14492344",
      "material": "https://drive.google.com/file/d/1FHz-hOpAtsfp7faWiX6hAkCpWadllmkh/view?usp=drive_link"
    }
  ],
  "DCO-07": [
    {
      "name": "Constituição da Bahia",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/disciplinas/direito-legislacao-estadual/constituicao-do-estado-da-bahia/questoes?utm_source=midia_paga&utm_medium=google_pmax&utm_campaign=qconcursos_acq_alwayson_pmax&gad_source=1&gad_campaignid=20200684311&gbraid=0AAAAAD42MG3dwIeluwQDrvk-jTlTyJ8ic&gclid=Cj0KCQjw16_UBhCqARIsAIdOaXyBjBh6f1NIZlfzoTnOzsgaIKxe0y9tmIWywnMcyjU72BnFo1RtPdYaAhTsEALw_wcB",
      "material": "https://drive.google.com/file/d/1kTDh_Ica1JF3kvpWVpl9LDJyPWVGpfR6/view?usp=drive_link"
    }
  ],
  "DCO-08": [
    {
      "name": "Constituição da Bahia",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/disciplinas/direito-legislacao-estadual/constituicao-do-estado-da-bahia/questoes?utm_source=midia_paga&utm_medium=google_pmax&utm_campaign=qconcursos_acq_alwayson_pmax&gad_source=1&gad_campaignid=20200684311&gbraid=0AAAAAD42MG3dwIeluwQDrvk-jTlTyJ8ic&gclid=Cj0KCQjw16_UBhCqARIsAIdOaXyBjBh6f1NIZlfzoTnOzsgaIKxe0y9tmIWywnMcyjU72BnFo1RtPdYaAhTsEALw_wcB",
      "material": "https://drive.google.com/file/d/1kTDh_Ica1JF3kvpWVpl9LDJyPWVGpfR6/view?usp=drive_link"
    }
  ],
  "DCO-09": [
    {
      "name": "Constituição da Bahia",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/disciplinas/direito-legislacao-estadual/constituicao-do-estado-da-bahia/questoes?utm_source=midia_paga&utm_medium=google_pmax&utm_campaign=qconcursos_acq_alwayson_pmax&gad_source=1&gad_campaignid=20200684311&gbraid=0AAAAAD42MG3dwIeluwQDrvk-jTlTyJ8ic&gclid=Cj0KCQjw16_UBhCqARIsAIdOaXyBjBh6f1NIZlfzoTnOzsgaIKxe0y9tmIWywnMcyjU72BnFo1RtPdYaAhTsEALw_wcB",
      "material": "https://drive.google.com/file/d/1kTDh_Ica1JF3kvpWVpl9LDJyPWVGpfR6/view?usp=drive_link"
    }
  ],
  "DCO-10": [
    {
      "name": "Constituição da Bahia",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/disciplinas/direito-legislacao-estadual/constituicao-do-estado-da-bahia/questoes?utm_source=midia_paga&utm_medium=google_pmax&utm_campaign=qconcursos_acq_alwayson_pmax&gad_source=1&gad_campaignid=20200684311&gbraid=0AAAAAD42MG3dwIeluwQDrvk-jTlTyJ8ic&gclid=Cj0KCQjw16_UBhCqARIsAIdOaXyBjBh6f1NIZlfzoTnOzsgaIKxe0y9tmIWywnMcyjU72BnFo1RtPdYaAhTsEALw_wcB",
      "material": "https://drive.google.com/file/d/1kTDh_Ica1JF3kvpWVpl9LDJyPWVGpfR6/view?usp=drive_link"
    }
  ],
  "DH-01": [
    {
      "name": "A Declaração Universal dos Direitos Humanos/1948",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?notebook_ids%5B%5D=14492377",
      "material": "https://docs.google.com/document/d/1lP0pAS5KZGyj7x5WGtvwakSqdWEVNCiD/edit?usp=drive_link&ouid=108414710559103394344&rtpof=true&sd=true"
    }
  ],
  "DH-02": [
    {
      "name": "Convenção Americana sobre Direitos Humanos/1969 (Pacto de São José da Costa Rica) (art. 1° ao 32) 1",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?notebook_ids%5B%5D=14492381",
      "material": "https://drive.google.com/file/d/1nEm0E586U34J1h0qqJDoILlvMnd2q0Pl/view?usp=drive_link"
    }
  ],
  "DH-03": [
    {
      "name": "Pacto Internacional dos Direitos Econômicos, Sociais e Culturais (art. 1° ao 15).",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?notebook_ids%5B%5D=14492382",
      "material": "https://drive.google.com/file/d/1lv1nbkS-9UMM9sMY3VXCRFPWPKV-XKlC/view?usp=drive_link"
    }
  ],
  "DH-04": [
    {
      "name": "Declaração de Pequim Adotada pela Quarta Conferência Mundial sobre as Mulheres: Ação para Igualdade, Desenvolvimento e Paz.",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/disciplinas/direito-direitos-humanos/declaracao-de-pequim-adotada-pela-quarta-conferencia-mundial-sobre-as-mulheres-acao-para-igualdade-desenvolvimento-e-paz/questoes?utm_source=midia_paga&utm_medium=google_pmax&utm_campaign=qconcursos_acq_alwayson_pmax&gad_source=1&gad_campaignid=20200684311&gbraid=0AAAAAD42MG1PtIRXYZAk64hEyf_qmgUpU&gclid=CjwKCAjwyOzSBhBTEiwAmxvJ-tY80aIngL1eXHrgnUdSSLw-dD9bEJnRxO7mY92_gZHiFU0qz0m3TxoCbxMQAvD_BwE",
      "material": "https://drive.google.com/file/d/1g1ejr62QlIgaZfUU5CcC6SDyun1ce4Ui/view?usp=drive_link"
    }
  ],
  "DAD-01": [
    {
      "name": "Organização Administrativa",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?discipline_ids%5B%5D=2&exclude_nullified=true&exclude_outdated=true&subject_ids%5B%5D=775",
      "material": null
    }
  ],
  "DAD-02": [
    {
      "name": "Regime Jurídico Administrativo",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?discipline_ids%5B%5D=2&exclude_nullified=true&exclude_outdated=true&subject_ids%5B%5D=15938",
      "material": null
    }
  ],
  "DAD-03": [
    {
      "name": "Poderes administrativos",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?discipline_ids%5B%5D=2&exclude_nullified=true&exclude_outdated=true&subject_ids%5B%5D=16022",
      "material": null
    }
  ],
  "DAD-04": [
    {
      "name": "Servidores Públicos",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?discipline_ids%5B%5D=2&exclude_nullified=true&exclude_outdated=true&subject_ids%5B%5D=15981&subject_ids%5B%5D=15989",
      "material": null
    }
  ],
  "DAD-05": [
    {
      "name": "Disposições Preliminares",
      "questions": "https://www.qconcursos.com/questoes-militares/disciplinas/direito-legislacao-estadual/lei-n-7-990-de-2001-estatuto-dos-policiais-militares-do-estado-da-bahia/questoes?utm_source=midia_paga&utm_medium=google_pmax&utm_campaign=qconcursos_acq_alwayson_pmax&gad_source=1&gad_campaignid=20200684311&gbraid=0AAAAAD42MG3dwIeluwQDrvk-jTlTyJ8ic&gclid=Cj0KCQjw16_UBhCqARIsAIdOaXy0KT8jXz52gvP95etLoAUr3WD2lXbgKG_OBYEvc3100jbE4One8r0aAm_REALw_wcB",
      "material": null
    },
    {
      "name": "Base Institucional da PMBA e requisitos de Ingresso",
      "questions": "https://www.qconcursos.com/questoes-militares/disciplinas/direito-legislacao-estadual/lei-n-7-990-de-2001-estatuto-dos-policiais-militares-do-estado-da-bahia/questoes?utm_source=midia_paga&utm_medium=google_pmax&utm_campaign=qconcursos_acq_alwayson_pmax&gad_source=1&gad_campaignid=20200684311&gbraid=0AAAAAD42MG3dwIeluwQDrvk-jTlTyJ8ic&gclid=Cj0KCQjw16_UBhCqARIsAIdOaXy0KT8jXz52gvP95etLoAUr3WD2lXbgKG_OBYEvc3100jbE4One8r0aAm_REALw_wcB",
      "material": null
    },
    {
      "name": "Escala Hierárquica da PMBA",
      "questions": "https://www.qconcursos.com/questoes-militares/disciplinas/direito-legislacao-estadual/lei-n-7-990-de-2001-estatuto-dos-policiais-militares-do-estado-da-bahia/questoes?utm_source=midia_paga&utm_medium=google_pmax&utm_campaign=qconcursos_acq_alwayson_pmax&gad_source=1&gad_campaignid=20200684311&gbraid=0AAAAAD42MG3dwIeluwQDrvk-jTlTyJ8ic&gclid=Cj0KCQjw16_UBhCqARIsAIdOaXy0KT8jXz52gvP95etLoAUr3WD2lXbgKG_OBYEvc3100jbE4One8r0aAm_REALw_wcB",
      "material": null
    },
    {
      "name": "Formas de Provimento",
      "questions": "https://www.qconcursos.com/questoes-militares/disciplinas/direito-legislacao-estadual/lei-n-7-990-de-2001-estatuto-dos-policiais-militares-do-estado-da-bahia/questoes?utm_source=midia_paga&utm_medium=google_pmax&utm_campaign=qconcursos_acq_alwayson_pmax&gad_source=1&gad_campaignid=20200684311&gbraid=0AAAAAD42MG3dwIeluwQDrvk-jTlTyJ8ic&gclid=Cj0KCQjw16_UBhCqARIsAIdOaXy0KT8jXz52gvP95etLoAUr3WD2lXbgKG_OBYEvc3100jbE4One8r0aAm_REALw_wcB",
      "material": null
    },
    {
      "name": "Situação Institucional",
      "questions": "https://www.qconcursos.com/questoes-militares/disciplinas/direito-legislacao-estadual/lei-n-7-990-de-2001-estatuto-dos-policiais-militares-do-estado-da-bahia/questoes?utm_source=midia_paga&utm_medium=google_pmax&utm_campaign=qconcursos_acq_alwayson_pmax&gad_source=1&gad_campaignid=20200684311&gbraid=0AAAAAD42MG3dwIeluwQDrvk-jTlTyJ8ic&gclid=Cj0KCQjw16_UBhCqARIsAIdOaXy0KT8jXz52gvP95etLoAUr3WD2lXbgKG_OBYEvc3100jbE4One8r0aAm_REALw_wcB",
      "material": null
    },
    {
      "name": "Da Reserva Remunerada",
      "questions": "https://www.qconcursos.com/questoes-militares/disciplinas/direito-legislacao-estadual/lei-n-7-990-de-2001-estatuto-dos-policiais-militares-do-estado-da-bahia/questoes?utm_source=midia_paga&utm_medium=google_pmax&utm_campaign=qconcursos_acq_alwayson_pmax&gad_source=1&gad_campaignid=20200684311&gbraid=0AAAAAD42MG3dwIeluwQDrvk-jTlTyJ8ic&gclid=Cj0KCQjw16_UBhCqARIsAIdOaXy0KT8jXz52gvP95etLoAUr3WD2lXbgKG_OBYEvc3100jbE4One8r0aAm_REALw_wcB",
      "material": null
    },
    {
      "name": "Dos militares da Ativa",
      "questions": "https://www.qconcursos.com/questoes-militares/disciplinas/direito-legislacao-estadual/lei-n-7-990-de-2001-estatuto-dos-policiais-militares-do-estado-da-bahia/questoes?utm_source=midia_paga&utm_medium=google_pmax&utm_campaign=qconcursos_acq_alwayson_pmax&gad_source=1&gad_campaignid=20200684311&gbraid=0AAAAAD42MG3dwIeluwQDrvk-jTlTyJ8ic&gclid=Cj0KCQjw16_UBhCqARIsAIdOaXy0KT8jXz52gvP95etLoAUr3WD2lXbgKG_OBYEvc3100jbE4One8r0aAm_REALw_wcB",
      "material": null
    },
    {
      "name": "Estabilidade",
      "questions": "https://www.qconcursos.com/questoes-militares/disciplinas/direito-legislacao-estadual/lei-n-7-990-de-2001-estatuto-dos-policiais-militares-do-estado-da-bahia/questoes?utm_source=midia_paga&utm_medium=google_pmax&utm_campaign=qconcursos_acq_alwayson_pmax&gad_source=1&gad_campaignid=20200684311&gbraid=0AAAAAD42MG3dwIeluwQDrvk-jTlTyJ8ic&gclid=Cj0KCQjw16_UBhCqARIsAIdOaXy0KT8jXz52gvP95etLoAUr3WD2lXbgKG_OBYEvc3100jbE4One8r0aAm_REALw_wcB",
      "material": null
    },
    {
      "name": "Responsabilidade, Comando e Subordinação",
      "questions": "https://www.qconcursos.com/questoes-militares/disciplinas/direito-legislacao-estadual/lei-n-7-990-de-2001-estatuto-dos-policiais-militares-do-estado-da-bahia/questoes?utm_source=midia_paga&utm_medium=google_pmax&utm_campaign=qconcursos_acq_alwayson_pmax&gad_source=1&gad_campaignid=20200684311&gbraid=0AAAAAD42MG3dwIeluwQDrvk-jTlTyJ8ic&gclid=Cj0KCQjw16_UBhCqARIsAIdOaXy0KT8jXz52gvP95etLoAUr3WD2lXbgKG_OBYEvc3100jbE4One8r0aAm_REALw_wcB",
      "material": null
    },
    {
      "name": "Responsabilidade e Sanções",
      "questions": "https://www.qconcursos.com/questoes-militares/disciplinas/direito-legislacao-estadual/lei-n-7-990-de-2001-estatuto-dos-policiais-militares-do-estado-da-bahia/questoes?utm_source=midia_paga&utm_medium=google_pmax&utm_campaign=qconcursos_acq_alwayson_pmax&gad_source=1&gad_campaignid=20200684311&gbraid=0AAAAAD42MG3dwIeluwQDrvk-jTlTyJ8ic&gclid=Cj0KCQjw16_UBhCqARIsAIdOaXy0KT8jXz52gvP95etLoAUr3WD2lXbgKG_OBYEvc3100jbE4One8r0aAm_REALw_wcB",
      "material": null
    }
  ],
  "DPE-01": [
    {
      "name": "Do crime.Elementos. Consumação e tentativa. Desistência voluntária e arrependimento eficaz. Arrependimento posterior. Crime impossível.",
      "questions": null,
      "material": "https://drive.google.com/file/d/19aVJYDLSYMt15nC2aqh-AFDDcNoVdlWa/view?usp=drive_link"
    }
  ],
  "DPE-02": [
    {
      "name": "Do crime.Elementos. Consumação e tentativa. Desistência voluntária e arrependimento eficaz. Arrependimento posterior. Crime impossível.",
      "questions": null,
      "material": "https://drive.google.com/file/d/19aVJYDLSYMt15nC2aqh-AFDDcNoVdlWa/view?usp=drive_link"
    }
  ],
  "DPE-03": [
    {
      "name": "Do crime.Elementos. Consumação e tentativa. Desistência voluntária e arrependimento eficaz. Arrependimento posterior. Crime impossível.",
      "questions": null,
      "material": "https://drive.google.com/file/d/19aVJYDLSYMt15nC2aqh-AFDDcNoVdlWa/view?usp=drive_link"
    }
  ],
  "DPE-04": [
    {
      "name": "Do crime.Elementos. Consumação e tentativa. Desistência voluntária e arrependimento eficaz. Arrependimento posterior. Crime impossível.",
      "questions": null,
      "material": "https://drive.google.com/file/d/19aVJYDLSYMt15nC2aqh-AFDDcNoVdlWa/view?usp=drive_link"
    }
  ],
  "DPE-05": [
    {
      "name": "Do crime.Elementos. Consumação e tentativa. Desistência voluntária e arrependimento eficaz. Arrependimento posterior. Crime impossível.",
      "questions": null,
      "material": "https://drive.google.com/file/d/19aVJYDLSYMt15nC2aqh-AFDDcNoVdlWa/view?usp=drive_link"
    }
  ],
  "DPE-06": [
    {
      "name": "Excludente de Ilicitude",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?notebook_ids%5B%5D=14492600",
      "material": null
    },
    {
      "name": "Culpabilidade e excludente de culpabilidade",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?notebook_ids%5B%5D=14492600",
      "material": null
    }
  ],
  "DPE-07": [
    {
      "name": "Contravenção",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?discipline_ids%5B%5D=9&exclude_nullified=true&exclude_outdated=true&per_page=5&scholarity_ids%5B%5D=2&sort=newest&subject_ids%5B%5D=17454",
      "material": null
    }
  ],
  "DPE-08": [
    {
      "name": "Dos crimes contra a vida (homicídio, lesão corporal e rixa). Aula 1",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?notebook_ids%5B%5D=14492614",
      "material": "https://drive.google.com/file/d/1IE64-U7SjCGVDS_XJEDZQdQbo1j-XclB/view?usp=drive_link"
    }
  ],
  "DPE-09": [
    {
      "name": "Dos crimes contra a liberdade pessoal (constrangimento ilegal,ameaça, perseguição, sequestro e cárcere privado). aula 01",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?notebook_ids%5B%5D=14492627",
      "material": "https://drive.google.com/file/d/1ACXcZp9fWsbvfaKo0fhKBu9F4waASbVD/view?usp=drive_link"
    }
  ],
  "DPE-10": [
    {
      "name": "Dos crimes contra o patrimônio (furto, roubo, extorsão, apropriação indébita, receptação).",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?notebook_ids%5B%5D=14492633",
      "material": "https://drive.google.com/file/d/1EWKpJKqEccjO7hrAzBAZZgpbo4Tb2Uks/view?usp=drive_link"
    }
  ],
  "DPE-11": [
    {
      "name": "Dos crimes contra a dignidade sexual. (estupro, importunação sexual, assédio sexual). aula 01",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?discipline_ids%5B%5D=9&exclude_nullified=true&exclude_outdated=true&per_page=5&scholarity_ids%5B%5D=2&sort=newest&subject_ids%5B%5D=17343",
      "material": "https://docs.google.com/document/d/1L_khWyQ79LzQNjecdfqqxvp-EUL5E0gA/edit?usp=drive_link&ouid=108414710559103394344&rtpof=true&sd=true"
    }
  ],
  "DPE-12": [
    {
      "name": "Corrupção ativa e passiva",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?notebook_ids%5B%5D=14492742",
      "material": "https://drive.google.com/file/d/1hUiNuMnCSAfCyLoWjddRULDIJRa3DAAD/view?usp=drive_link"
    }
  ],
  "DPE-13": [
    {
      "name": "Corrupção ativa e passiva",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?notebook_ids%5B%5D=14492742",
      "material": "https://drive.google.com/file/d/1hUiNuMnCSAfCyLoWjddRULDIJRa3DAAD/view?usp=drive_link"
    }
  ],
  "DPE-14": [
    {
      "name": "Lei N° 9.455, De 7 De Abril De 1997 (Crime De Tortura)",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?discipline_ids%5B%5D=9&exclude_nullified=true&exclude_outdated=true&subject_ids%5B%5D=17462",
      "material": null
    }
  ],
  "IRG-03": [
    {
      "name": "Lei federal n° 12.288, de 20 de julho de 2010 (Estatuto da Igualdade Racial).",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?notebook_ids%5B%5D=14492871",
      "material": "https://drive.google.com/file/d/1MPAHkhqmzebQfo4XuueHz_EA8rwSlqDV/view?usp=drive_link"
    }
  ],
  "IRG-04": [
    {
      "name": "Lei federal nº 7.716, de 5 de janeiro de 1989 (Define os crimes resultantes de preconceito de raça ou de cor) e Lei federal n° 9.459, de 13 de maio de 1997 (Tipificação dos crimes resultantes de preconceito de raça ou de cor).",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?notebook_ids%5B%5D=14492879",
      "material": "https://drive.google.com/file/d/1i8UfYzw4jZVs1J0nmKAeamkj76gMY4w9/view?usp=drive_link"
    }
  ],
  "IRG-05": [
    {
      "name": "Decreto federal n° 65.810, de 08 de dezembro de 1969 (Convenção internacional sobre a eliminação de todas as formas de discriminação racial).",
      "questions": "https://www.qconcursos.com/questoes-militares/disciplinas/direito-direitos-humanos/convencao-internacional-sobre-eliminacao-de-todas-as-formas-de-discriminacao-racial/questoes?utm_source=midia_paga&utm_medium=google_pmax&utm_campaign=qconcursos_acq_alwayson_pmax&gad_source=1&gad_campaignid=20200684311&gbraid=0AAAAAD42MG1PtIRXYZAk64hEyf_qmgUpU&gclid=CjwKCAjwyOzSBhBTEiwAmxvJ-iWyobDxyEuWV5J_zfQo99gIOO6UpO1FhMtFBKRSk08QrRUCbQYwfBoCCBMQAvD_BwE",
      "material": "https://drive.google.com/file/d/1gH9sh_LuyGues8XEEHugBkLH-6KVhL-P/view?usp=drive_link"
    }
  ],
  "IRG-06": [
    {
      "name": "Decreto Federal n° 4.377, de 13 de setembro de 2002 (Convenção sobre a eliminação de todas as formas de discriminação contra a mulher).",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/disciplinas/direito-direitos-humanos/convencao-sobre-a-eliminacao-de-todas-as-formas-de-discriminacao-contra-a-mulher/questoes?utm_source=midia_paga&utm_medium=google_pmax&utm_campaign=qconcursos_acq_alwayson_pmax&gad_source=1&gad_campaignid=20200684311&gbraid=0AAAAAD42MG1PtIRXYZAk64hEyf_qmgUpU&gclid=CjwKCAjwyOzSBhBTEiwAmxvJ-oN1wkbw7VGkMrGpaXcHahzrtCF9Q58f1oLoGCiCP9iacRmDEoCfKBoCpvkQAvD_BwE",
      "material": "https://drive.google.com/file/d/1CFjg7_7--sHxuYSYQv3rkkddLBh5mDHn/view?usp=drive_link"
    }
  ],
  "IRG-07": [
    {
      "name": "Lei federal nº 11.340, de 7 de agosto de 2006 (Lei Maria da Penha) e alterações propostas pelas Leis nº 13.827/2019, 13.871/2019 e 13.882/2019 1",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?notebook_ids%5B%5D=14492842",
      "material": "https://drive.google.com/file/d/1ZTSHwPwlOxiOGzATFcrH8RD3kF9uaFiT/view?usp=drive_link"
    }
  ],
  "IRG-08": [
    {
      "name": "Código Penal Brasileiro (art. 140)",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?notebook_ids%5B%5D=14492852",
      "material": "https://drive.google.com/file/d/19yoO2ie7xUjzDoa5l4jGbhgVqkQHGSIn/view?usp=drive_link"
    }
  ],
  "IRG-09": [
    {
      "name": "Lei federal n° 9.455, de 7 de abril de 1997 (Crime de Tortura)",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?notebook_ids%5B%5D=14492747",
      "material": "https://drive.google.com/file/d/1ogkuJFbysxLaT16814hsJ6G1VwHOGI_c/view?usp=drive_link"
    }
  ],
  "IRG-10": [
    {
      "name": "Lei de Caó (Lei nº. 7.437 de 1985)",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?notebook_ids%5B%5D=14492861",
      "material": "https://drive.google.com/file/d/11BzsbqoVveKxNrheKeXWJnBGX3EEuezR/view?usp=drive_link"
    }
  ],
  "IRG-11": [
    {
      "name": "Lei estadual n° 10.549, de 28 de dezembro de 2006 (Secretaria de Promoção da Igualdade Racial), alterada pela Lei estadual n° 12.212, de 04 de maio de 2011.",
      "questions": null,
      "material": "https://drive.google.com/file/d/1uGO3lzEtRAQXWBFYXNTCObLwbLpRSy4x/view?usp=drive_link"
    }
  ],
  "IRG-12": [
    {
      "name": "Lei Federal nº 10.678, de 23 de maio de 2003, com as alterações da Lei federal nº 13.341, de 29 de setembro de 2016 (Referente à Secretaria de Políticas de Promoção da Igualdade Racial da Presidência da República).",
      "questions": "https://www.qconcursos.com/questoes-de-concursos/questoes?discipline_ids%5B%5D=53&per_page=20&scholarity_ids%5B%5D=2&sort=newest&subject_ids%5B%5D=9433",
      "material": "https://drive.google.com/file/d/15Xcf1jhYvA01glPRxhf32YCYn7ZsIWXI/view?usp=drive_link"
    }
  ],
  "DPM-01": [
    {
      "name": "Crimes contra a autoridade ou disciplina militar",
      "questions": "https://www.qconcursos.com/questoes-militares/questoes?discipline_ids%5B%5D=203&exclude_nullified=true&exclude_outdated=true&per_page=20&sort=newest&subject_ids%5B%5D=21345",
      "material": "https://drive.google.com/file/d/1kVoz8wX3otCovsMxc-1eYod7R45Pbob6/view?usp=drive_link"
    }
  ],
  "DPM-02": [
    {
      "name": "Crimes contra a autoridade ou disciplina militar",
      "questions": "https://www.qconcursos.com/questoes-militares/questoes?discipline_ids%5B%5D=203&exclude_nullified=true&exclude_outdated=true&per_page=20&sort=newest&subject_ids%5B%5D=21345",
      "material": "https://drive.google.com/file/d/1kVoz8wX3otCovsMxc-1eYod7R45Pbob6/view?usp=drive_link"
    }
  ],
  "DPM-03": [
    {
      "name": "Crimes contra a autoridade ou disciplina militar",
      "questions": "https://www.qconcursos.com/questoes-militares/questoes?discipline_ids%5B%5D=203&exclude_nullified=true&exclude_outdated=true&per_page=20&sort=newest&subject_ids%5B%5D=21345",
      "material": "https://drive.google.com/file/d/1kVoz8wX3otCovsMxc-1eYod7R45Pbob6/view?usp=drive_link"
    }
  ],
  "DPM-04": [
    {
      "name": "Crimes contra a autoridade ou disciplina militar",
      "questions": "https://www.qconcursos.com/questoes-militares/questoes?discipline_ids%5B%5D=203&exclude_nullified=true&exclude_outdated=true&per_page=20&sort=newest&subject_ids%5B%5D=21345",
      "material": "https://drive.google.com/file/d/1kVoz8wX3otCovsMxc-1eYod7R45Pbob6/view?usp=drive_link"
    }
  ],
  "DPM-05": [
    {
      "name": "Crimes contra a autoridade ou disciplina militar",
      "questions": "https://www.qconcursos.com/questoes-militares/questoes?discipline_ids%5B%5D=203&exclude_nullified=true&exclude_outdated=true&per_page=20&sort=newest&subject_ids%5B%5D=21345",
      "material": "https://drive.google.com/file/d/1kVoz8wX3otCovsMxc-1eYod7R45Pbob6/view?usp=drive_link"
    }
  ],
  "DPM-06": [
    {
      "name": "Crimes contra a autoridade ou disciplina militar",
      "questions": "https://www.qconcursos.com/questoes-militares/questoes?discipline_ids%5B%5D=203&exclude_nullified=true&exclude_outdated=true&per_page=20&sort=newest&subject_ids%5B%5D=21345",
      "material": "https://drive.google.com/file/d/1kVoz8wX3otCovsMxc-1eYod7R45Pbob6/view?usp=drive_link"
    }
  ],
  "DPM-07": [
    {
      "name": "Crimes contra a autoridade ou disciplina militar",
      "questions": "https://www.qconcursos.com/questoes-militares/questoes?discipline_ids%5B%5D=203&exclude_nullified=true&exclude_outdated=true&per_page=20&sort=newest&subject_ids%5B%5D=21345",
      "material": "https://drive.google.com/file/d/1kVoz8wX3otCovsMxc-1eYod7R45Pbob6/view?usp=drive_link"
    }
  ],
  "DPM-08": [
    {
      "name": "Dos crimes contra o serviço militar e o dever militar: deserção, abandono de posto, descumprimento de missão, embriaguez em serviço, dormir em serviço.",
      "questions": "https://www.qconcursos.com/questoes-militares/questoes?discipline_ids%5B%5D=203&exclude_nullified=true&exclude_outdated=true&per_page=20&sort=newest&subject_ids%5B%5D=21347",
      "material": "https://drive.google.com/file/d/1jOg-Iv4c5fiHdFnB-ZKULE0MccSef1q1/view?usp=sharing"
    }
  ],
  "DPM-09": [
    {
      "name": "Crimes contra a Administração Militar: desacato a superior, desacato a militar, desobediência, peculato, peculato-furto, concussão",
      "questions": "https://www.qconcursos.com/questoes-militares/questoes?discipline_ids%5B%5D=203&exclude_nullified=true&exclude_outdated=true&per_page=20&sort=newest&subject_ids%5B%5D=21350",
      "material": "https://drive.google.com/file/d/1deLT8XYFLeeka2TcpYMA1gsxqj3YGWHk/view?usp=sharing"
    }
  ],
  "DPM-10": [
    {
      "name": "Dos crimes contra o serviço militar e o dever militar: deserção, abandono de posto, descumprimento de missão, embriaguez em serviço, dormir em serviço.",
      "questions": "https://www.qconcursos.com/questoes-militares/questoes?discipline_ids%5B%5D=203&exclude_nullified=true&exclude_outdated=true&per_page=20&sort=newest&subject_ids%5B%5D=21347",
      "material": "https://drive.google.com/file/d/1jOg-Iv4c5fiHdFnB-ZKULE0MccSef1q1/view?usp=sharing"
    }
  ],
  "RED-01": [
    {
      "name": "Noções introdutórias sobre redação",
      "questions": null,
      "material": "https://drive.google.com/drive/folders/1BDzfltmQ6wT5ipPcT0JrVg4ZGnu2DjBB"
    },
    {
      "name": "Estrutura - Introdução",
      "questions": null,
      "material": "https://drive.google.com/drive/folders/1BDzfltmQ6wT5ipPcT0JrVg4ZGnu2DjBB"
    },
    {
      "name": "Estrutura - Desenvolvimento e conclusão",
      "questions": null,
      "material": "https://drive.google.com/drive/folders/1BDzfltmQ6wT5ipPcT0JrVg4ZGnu2DjBB"
    },
    {
      "name": "O que não fazer na redação",
      "questions": null,
      "material": "https://drive.google.com/drive/folders/1BDzfltmQ6wT5ipPcT0JrVg4ZGnu2DjBB"
    },
    {
      "name": "Ambiguidade",
      "questions": null,
      "material": "https://drive.google.com/drive/folders/1BDzfltmQ6wT5ipPcT0JrVg4ZGnu2DjBB"
    },
    {
      "name": "Correção de redação",
      "questions": null,
      "material": "https://drive.google.com/drive/folders/1BDzfltmQ6wT5ipPcT0JrVg4ZGnu2DjBB"
    }
  ]
};

export const LESSON_RESOURCE: Readonly<Record<string, readonly [topicCode: string, index: number]>> = {
  "portugues:0": [
    "LP-01",
    0
  ],
  "portugues:1": [
    "LP-02",
    0
  ],
  "portugues:2": [
    "LP-02",
    0
  ],
  "portugues:3": [
    "LP-02",
    0
  ],
  "portugues:4": [
    "LP-03",
    0
  ],
  "portugues:5": [
    "LP-04",
    0
  ],
  "portugues:6": [
    "LP-04",
    0
  ],
  "portugues:7": [
    "LP-05",
    0
  ],
  "portugues:8": [
    "LP-05",
    0
  ],
  "portugues:9": [
    "LP-05",
    0
  ],
  "portugues:10": [
    "LP-05",
    0
  ],
  "portugues:11": [
    "LP-05",
    0
  ],
  "portugues:12": [
    "LP-05",
    0
  ],
  "portugues:13": [
    "LP-05",
    0
  ],
  "portugues:14": [
    "LP-05",
    0
  ],
  "portugues:15": [
    "LP-05",
    0
  ],
  "portugues:16": [
    "LP-05",
    0
  ],
  "portugues:17": [
    "LP-05",
    0
  ],
  "portugues:18": [
    "LP-06",
    0
  ],
  "portugues:19": [
    "LP-06",
    0
  ],
  "portugues:20": [
    "LP-06",
    0
  ],
  "portugues:21": [
    "LP-07",
    0
  ],
  "portugues:22": [
    "LP-07",
    0
  ],
  "portugues:23": [
    "LP-07",
    0
  ],
  "portugues:24": [
    "LP-07",
    0
  ],
  "portugues:25": [
    "LP-07",
    0
  ],
  "portugues:26": [
    "LP-07",
    0
  ],
  "portugues:27": [
    "LP-07",
    0
  ],
  "portugues:28": [
    "LP-07",
    0
  ],
  "portugues:29": [
    "LP-07",
    0
  ],
  "portugues:30": [
    "LP-07",
    0
  ],
  "portugues:31": [
    "LP-07",
    0
  ],
  "portugues:32": [
    "LP-07",
    0
  ],
  "portugues:33": [
    "LP-07",
    1
  ],
  "portugues:34": [
    "LP-07",
    1
  ],
  "portugues:35": [
    "LP-07",
    1
  ],
  "portugues:36": [
    "LP-07",
    1
  ],
  "portugues:37": [
    "LP-07",
    1
  ],
  "portugues:38": [
    "LP-07",
    1
  ],
  "portugues:39": [
    "LP-07",
    1
  ],
  "portugues:40": [
    "LP-07",
    1
  ],
  "portugues:41": [
    "LP-08",
    0
  ],
  "portugues:42": [
    "LP-08",
    0
  ],
  "portugues:43": [
    "LP-08",
    0
  ],
  "portugues:44": [
    "LP-09",
    0
  ],
  "portugues:45": [
    "LP-09",
    0
  ],
  "portugues:46": [
    "LP-09",
    0
  ],
  "portugues:47": [
    "LP-09",
    0
  ],
  "portugues:48": [
    "LP-09",
    0
  ],
  "portugues:49": [
    "LP-09",
    0
  ],
  "portugues:50": [
    "LP-09",
    0
  ],
  "portugues:51": [
    "LP-10",
    0
  ],
  "portugues:52": [
    "LP-10",
    1
  ],
  "portugues:53": [
    "LP-11",
    0
  ],
  "matematica:0": [
    "MAT-01",
    1
  ],
  "matematica:1": [
    "MAT-01",
    2
  ],
  "matematica:2": [
    "MAT-02",
    0
  ],
  "matematica:3": [
    "MAT-02",
    0
  ],
  "matematica:4": [
    "MAT-02",
    1
  ],
  "matematica:5": [
    "MAT-02",
    2
  ],
  "matematica:6": [
    "MAT-02",
    3
  ],
  "matematica:7": [
    "MAT-01",
    4
  ],
  "matematica:8": [
    "MAT-01",
    0
  ],
  "matematica:9": [
    "MAT-01",
    0
  ],
  "matematica:10": [
    "MAT-05",
    0
  ],
  "matematica:11": [
    "MAT-05",
    1
  ],
  "matematica:12": [
    "MAT-05",
    1
  ],
  "matematica:13": [
    "MAT-01",
    5
  ],
  "matematica:14": [
    "MAT-01",
    6
  ],
  "matematica:15": [
    "MAT-01",
    6
  ],
  "matematica:16": [
    "MAT-01",
    7
  ],
  "matematica:17": [
    "MAT-01",
    7
  ],
  "matematica:18": [
    "MAT-03",
    0
  ],
  "matematica:19": [
    "MAT-03",
    1
  ],
  "matematica:20": [
    "MAT-05",
    2
  ],
  "matematica:21": [
    "MAT-03",
    2
  ],
  "matematica:22": [
    "MAT-03",
    3
  ],
  "matematica:23": [
    "MAT-03",
    4
  ],
  "matematica:24": [
    "MAT-04",
    0
  ],
  "matematica:25": [
    "MAT-04",
    0
  ],
  "matematica:26": [
    "MAT-06",
    0
  ],
  "matematica:27": [
    "MAT-06",
    0
  ],
  "matematica:28": [
    "MAT-06",
    0
  ],
  "matematica:29": [
    "MAT-06",
    0
  ],
  "matematica:30": [
    "MAT-07",
    0
  ],
  "informatica:0": [
    "INF-01",
    0
  ],
  "informatica:1": [
    "INF-01",
    0
  ],
  "informatica:2": [
    "INF-01",
    0
  ],
  "informatica:3": [
    "INF-02",
    0
  ],
  "informatica:4": [
    "INF-02",
    0
  ],
  "informatica:5": [
    "INF-02",
    0
  ],
  "informatica:6": [
    "INF-02",
    0
  ],
  "informatica:7": [
    "INF-02",
    0
  ],
  "informatica:8": [
    "INF-02",
    0
  ],
  "informatica:9": [
    "INF-03",
    0
  ],
  "informatica:10": [
    "INF-04",
    0
  ],
  "informatica:11": [
    "INF-05",
    0
  ],
  "informatica:12": [
    "INF-05",
    0
  ],
  "informatica:13": [
    "INF-05",
    0
  ],
  "informatica:14": [
    "INF-05",
    0
  ],
  "informatica:15": [
    "INF-06",
    0
  ],
  "informatica:16": [
    "INF-06",
    0
  ],
  "informatica:17": [
    "INF-06",
    0
  ],
  "informatica:18": [
    "INF-07",
    0
  ],
  "informatica:19": [
    "INF-07",
    0
  ],
  "historia:0": [
    "HIST-01",
    0
  ],
  "historia:1": [
    "HIST-02",
    0
  ],
  "historia:2": [
    "HIST-02",
    0
  ],
  "historia:3": [
    "HIST-02",
    0
  ],
  "historia:4": [
    "HIST-02",
    0
  ],
  "historia:5": [
    "HIST-02",
    0
  ],
  "historia:6": [
    "HIST-02",
    0
  ],
  "historia:7": [
    "HIST-02",
    0
  ],
  "historia:8": [
    "HIST-02",
    0
  ],
  "historia:9": [
    "HIST-02",
    0
  ],
  "historia:10": [
    "HIST-03",
    0
  ],
  "historia:11": [
    "HIST-04",
    0
  ],
  "historia:12": [
    "HIST-05",
    0
  ],
  "historia:13": [
    "HIST-05",
    0
  ],
  "historia:14": [
    "HIST-05",
    0
  ],
  "historia:15": [
    "HIST-06",
    0
  ],
  "historia:16": [
    "HIST-06",
    0
  ],
  "historia:17": [
    "HIST-06",
    0
  ],
  "historia:18": [
    "HIST-06",
    0
  ],
  "historia:19": [
    "HIST-06",
    0
  ],
  "historia:20": [
    "HIST-06",
    0
  ],
  "historia:21": [
    "HIST-07",
    0
  ],
  "historia:22": [
    "HIST-08",
    0
  ],
  "historia:23": [
    "HIST-08",
    0
  ],
  "historia:24": [
    "HIST-08",
    0
  ],
  "historia:25": [
    "HIST-08",
    0
  ],
  "historia:26": [
    "HIST-09",
    0
  ],
  "historia:27": [
    "HIST-09",
    0
  ],
  "historia:28": [
    "HIST-09",
    0
  ],
  "historia:29": [
    "HIST-09",
    0
  ],
  "historia:30": [
    "HIST-09",
    0
  ],
  "historia:31": [
    "HIST-09",
    0
  ],
  "historia:32": [
    "HIST-09",
    0
  ],
  "historia:33": [
    "HIST-09",
    0
  ],
  "historia:34": [
    "HIST-10",
    0
  ],
  "historia:35": [
    "HIST-10",
    0
  ],
  "historia:36": [
    "HIST-10",
    0
  ],
  "historia:37": [
    "HIST-10",
    0
  ],
  "historia:38": [
    "HIST-10",
    0
  ],
  "geografia:0": [
    "GEO-01",
    0
  ],
  "geografia:1": [
    "GEO-01",
    0
  ],
  "geografia:2": [
    "GEO-01",
    0
  ],
  "geografia:3": [
    "GEO-02",
    0
  ],
  "geografia:4": [
    "GEO-02",
    0
  ],
  "geografia:5": [
    "GEO-02",
    0
  ],
  "geografia:6": [
    "GEO-02",
    0
  ],
  "geografia:7": [
    "GEO-02",
    0
  ],
  "geografia:8": [
    "GEO-02",
    0
  ],
  "geografia:9": [
    "GEO-02",
    0
  ],
  "geografia:10": [
    "GEO-03",
    0
  ],
  "geografia:11": [
    "GEO-03",
    0
  ],
  "geografia:12": [
    "GEO-03",
    0
  ],
  "geografia:13": [
    "GEO-04",
    0
  ],
  "geografia:14": [
    "GEO-05",
    0
  ],
  "geografia:15": [
    "GEO-05",
    0
  ],
  "geografia:16": [
    "GEO-05",
    0
  ],
  "geografia:17": [
    "GEO-05",
    0
  ],
  "geografia:18": [
    "GEO-05",
    0
  ],
  "geografia:19": [
    "GEO-06",
    0
  ],
  "geografia:20": [
    "GEO-06",
    0
  ],
  "geografia:21": [
    "GEO-06",
    0
  ],
  "dconst:0": [
    "DCO-01",
    0
  ],
  "dconst:1": [
    "DCO-01",
    0
  ],
  "dconst:2": [
    "DCO-01",
    0
  ],
  "dconst:3": [
    "DCO-01",
    0
  ],
  "dconst:4": [
    "DCO-01",
    0
  ],
  "dconst:5": [
    "DCO-02",
    0
  ],
  "dconst:6": [
    "DCO-02",
    0
  ],
  "dconst:7": [
    "DCO-02",
    0
  ],
  "dconst:8": [
    "DCO-02",
    0
  ],
  "dconst:9": [
    "DCO-02",
    1
  ],
  "dconst:10": [
    "DCO-02",
    1
  ],
  "dconst:11": [
    "DCO-02",
    1
  ],
  "dconst:12": [
    "DCO-02",
    1
  ],
  "dconst:13": [
    "DCO-02",
    1
  ],
  "dconst:14": [
    "DCO-02",
    1
  ],
  "dconst:15": [
    "DCO-02",
    1
  ],
  "dconst:16": [
    "DCO-02",
    2
  ],
  "dconst:17": [
    "DCO-02",
    2
  ],
  "dconst:18": [
    "DCO-02",
    2
  ],
  "dconst:19": [
    "DCO-02",
    2
  ],
  "dconst:20": [
    "DCO-02",
    2
  ],
  "dconst:21": [
    "DCO-02",
    3
  ],
  "dconst:22": [
    "DCO-02",
    3
  ],
  "dconst:23": [
    "DCO-02",
    3
  ],
  "dconst:24": [
    "DCO-02",
    3
  ],
  "dconst:25": [
    "DCO-02",
    3
  ],
  "dconst:26": [
    "DCO-02",
    4
  ],
  "dconst:27": [
    "DCO-02",
    4
  ],
  "dconst:28": [
    "DCO-02",
    4
  ],
  "dconst:29": [
    "DCO-02",
    4
  ],
  "dconst:30": [
    "DCO-02",
    4
  ],
  "dconst:31": [
    "DCO-02",
    5
  ],
  "dconst:32": [
    "DCO-02",
    5
  ],
  "dconst:33": [
    "DCO-02",
    5
  ],
  "dconst:34": [
    "DCO-02",
    5
  ],
  "dconst:35": [
    "DCO-02",
    5
  ],
  "dconst:36": [
    "DCO-02",
    6
  ],
  "dconst:37": [
    "DCO-02",
    6
  ],
  "dconst:38": [
    "DCO-02",
    6
  ],
  "dconst:39": [
    "DCO-03",
    0
  ],
  "dconst:40": [
    "DCO-03",
    0
  ],
  "dconst:41": [
    "DCO-03",
    0
  ],
  "dconst:42": [
    "DCO-03",
    0
  ],
  "dconst:43": [
    "DCO-03",
    0
  ],
  "dconst:44": [
    "DCO-03",
    0
  ],
  "dconst:45": [
    "DCO-03",
    0
  ],
  "dconst:46": [
    "DCO-03",
    0
  ],
  "dconst:48": [
    "DCO-06",
    0
  ],
  "dconst:49": [
    "DCO-06",
    0
  ],
  "dconst:50": [
    "DCO-06",
    0
  ],
  "dconst:51": [
    "DCO-07",
    0
  ],
  "dconst:52": [
    "DCO-08",
    0
  ],
  "dconst:53": [
    "DCO-09",
    0
  ],
  "dconst:54": [
    "DCO-09",
    0
  ],
  "dconst:55": [
    "DCO-10",
    0
  ],
  "dh:0": [
    "DH-01",
    0
  ],
  "dh:1": [
    "DH-01",
    0
  ],
  "dh:2": [
    "DH-01",
    0
  ],
  "dh:3": [
    "DH-01",
    0
  ],
  "dh:4": [
    "DH-01",
    0
  ],
  "dh:5": [
    "DH-01",
    0
  ],
  "dh:6": [
    "DH-02",
    0
  ],
  "dh:7": [
    "DH-02",
    0
  ],
  "dh:8": [
    "DH-02",
    0
  ],
  "dh:9": [
    "DH-02",
    0
  ],
  "dh:10": [
    "DH-02",
    0
  ],
  "dh:11": [
    "DH-02",
    0
  ],
  "dh:12": [
    "DH-02",
    0
  ],
  "dh:13": [
    "DH-02",
    0
  ],
  "dh:14": [
    "DH-02",
    0
  ],
  "dh:15": [
    "DH-02",
    0
  ],
  "dh:16": [
    "DH-03",
    0
  ],
  "dh:17": [
    "DH-03",
    0
  ],
  "dh:18": [
    "DH-03",
    0
  ],
  "dh:19": [
    "DH-03",
    0
  ],
  "dh:20": [
    "DH-04",
    0
  ],
  "dh:21": [
    "DH-04",
    0
  ],
  "dh:22": [
    "DH-04",
    0
  ],
  "dadmin:0": [
    "DAD-01",
    0
  ],
  "dadmin:1": [
    "DAD-01",
    0
  ],
  "dadmin:2": [
    "DAD-01",
    0
  ],
  "dadmin:3": [
    "DAD-01",
    0
  ],
  "dadmin:4": [
    "DAD-01",
    0
  ],
  "dadmin:5": [
    "DAD-01",
    0
  ],
  "dadmin:6": [
    "DAD-01",
    0
  ],
  "dadmin:7": [
    "DAD-02",
    0
  ],
  "dadmin:8": [
    "DAD-02",
    0
  ],
  "dadmin:9": [
    "DAD-02",
    0
  ],
  "dadmin:10": [
    "DAD-02",
    0
  ],
  "dadmin:11": [
    "DAD-02",
    0
  ],
  "dadmin:12": [
    "DAD-03",
    0
  ],
  "dadmin:13": [
    "DAD-03",
    0
  ],
  "dadmin:14": [
    "DAD-03",
    0
  ],
  "dadmin:15": [
    "DAD-03",
    0
  ],
  "dadmin:16": [
    "DAD-03",
    0
  ],
  "dadmin:17": [
    "DAD-03",
    0
  ],
  "dadmin:18": [
    "DAD-03",
    0
  ],
  "dadmin:19": [
    "DAD-03",
    0
  ],
  "dadmin:20": [
    "DAD-03",
    0
  ],
  "dadmin:21": [
    "DAD-04",
    0
  ],
  "dadmin:22": [
    "DAD-04",
    0
  ],
  "dadmin:23": [
    "DAD-04",
    0
  ],
  "dadmin:24": [
    "DAD-04",
    0
  ],
  "dadmin:25": [
    "DAD-04",
    0
  ],
  "dadmin:26": [
    "DAD-05",
    0
  ],
  "dadmin:27": [
    "DAD-05",
    1
  ],
  "dadmin:28": [
    "DAD-05",
    2
  ],
  "dadmin:29": [
    "DAD-05",
    3
  ],
  "dadmin:30": [
    "DAD-05",
    4
  ],
  "dadmin:31": [
    "DAD-05",
    5
  ],
  "dadmin:32": [
    "DAD-05",
    6
  ],
  "dadmin:33": [
    "DAD-05",
    7
  ],
  "dadmin:34": [
    "DAD-05",
    8
  ],
  "dadmin:35": [
    "DAD-05",
    9
  ],
  "dpenal:0": [
    "DPE-01",
    0
  ],
  "dpenal:1": [
    "DPE-01",
    0
  ],
  "dpenal:2": [
    "DPE-03",
    0
  ],
  "dpenal:3": [
    "DPE-05",
    0
  ],
  "dpenal:4": [
    "DPE-06",
    0
  ],
  "dpenal:5": [
    "DPE-06",
    0
  ],
  "dpenal:6": [
    "DPE-06",
    0
  ],
  "dpenal:7": [
    "DPE-06",
    1
  ],
  "dpenal:8": [
    "DPE-06",
    1
  ],
  "dpenal:9": [
    "DPE-06",
    1
  ],
  "dpenal:10": [
    "DPE-07",
    0
  ],
  "dpenal:11": [
    "DPE-07",
    0
  ],
  "dpenal:12": [
    "DPE-08",
    0
  ],
  "dpenal:13": [
    "DPE-08",
    0
  ],
  "dpenal:14": [
    "DPE-08",
    0
  ],
  "dpenal:15": [
    "DPE-08",
    0
  ],
  "dpenal:16": [
    "DPE-08",
    0
  ],
  "dpenal:17": [
    "DPE-08",
    0
  ],
  "dpenal:18": [
    "DPE-08",
    0
  ],
  "dpenal:19": [
    "DPE-08",
    0
  ],
  "dpenal:20": [
    "DPE-08",
    0
  ],
  "dpenal:21": [
    "DPE-08",
    0
  ],
  "dpenal:22": [
    "DPE-09",
    0
  ],
  "dpenal:23": [
    "DPE-09",
    0
  ],
  "dpenal:24": [
    "DPE-09",
    0
  ],
  "dpenal:25": [
    "DPE-09",
    0
  ],
  "dpenal:26": [
    "DPE-09",
    0
  ],
  "dpenal:27": [
    "DPE-10",
    0
  ],
  "dpenal:28": [
    "DPE-10",
    0
  ],
  "dpenal:29": [
    "DPE-10",
    0
  ],
  "dpenal:30": [
    "DPE-10",
    0
  ],
  "dpenal:31": [
    "DPE-10",
    0
  ],
  "dpenal:32": [
    "DPE-10",
    0
  ],
  "dpenal:33": [
    "DPE-10",
    0
  ],
  "dpenal:34": [
    "DPE-10",
    0
  ],
  "dpenal:35": [
    "DPE-11",
    0
  ],
  "dpenal:36": [
    "DPE-11",
    0
  ],
  "dpenal:37": [
    "DPE-11",
    0
  ],
  "dpenal:38": [
    "DPE-11",
    0
  ],
  "dpenal:39": [
    "DPE-12",
    0
  ],
  "dpenal:40": [
    "DPE-12",
    0
  ],
  "dpenal:41": [
    "DPE-14",
    0
  ],
  "dpenal:42": [
    "DPE-14",
    0
  ],
  "igualdade:2": [
    "IRG-03",
    0
  ],
  "igualdade:3": [
    "IRG-03",
    0
  ],
  "igualdade:4": [
    "IRG-03",
    0
  ],
  "igualdade:5": [
    "IRG-03",
    0
  ],
  "igualdade:6": [
    "IRG-03",
    0
  ],
  "igualdade:7": [
    "IRG-04",
    0
  ],
  "igualdade:8": [
    "IRG-04",
    0
  ],
  "igualdade:9": [
    "IRG-04",
    0
  ],
  "igualdade:10": [
    "IRG-04",
    0
  ],
  "igualdade:11": [
    "IRG-04",
    0
  ],
  "igualdade:12": [
    "IRG-04",
    0
  ],
  "igualdade:13": [
    "IRG-05",
    0
  ],
  "igualdade:14": [
    "IRG-05",
    0
  ],
  "igualdade:15": [
    "IRG-05",
    0
  ],
  "igualdade:16": [
    "IRG-05",
    0
  ],
  "igualdade:17": [
    "IRG-06",
    0
  ],
  "igualdade:18": [
    "IRG-06",
    0
  ],
  "igualdade:19": [
    "IRG-06",
    0
  ],
  "igualdade:20": [
    "IRG-06",
    0
  ],
  "igualdade:21": [
    "IRG-06",
    0
  ],
  "igualdade:22": [
    "IRG-07",
    0
  ],
  "igualdade:23": [
    "IRG-07",
    0
  ],
  "igualdade:24": [
    "IRG-07",
    0
  ],
  "igualdade:25": [
    "IRG-07",
    0
  ],
  "igualdade:26": [
    "IRG-07",
    0
  ],
  "igualdade:27": [
    "IRG-07",
    0
  ],
  "igualdade:28": [
    "IRG-07",
    0
  ],
  "igualdade:29": [
    "IRG-07",
    0
  ],
  "igualdade:30": [
    "IRG-07",
    0
  ],
  "igualdade:31": [
    "IRG-08",
    0
  ],
  "igualdade:32": [
    "IRG-08",
    0
  ],
  "igualdade:33": [
    "IRG-08",
    0
  ],
  "igualdade:34": [
    "IRG-08",
    0
  ],
  "igualdade:35": [
    "IRG-09",
    0
  ],
  "igualdade:36": [
    "IRG-09",
    0
  ],
  "igualdade:37": [
    "IRG-09",
    0
  ],
  "igualdade:38": [
    "IRG-09",
    0
  ],
  "igualdade:39": [
    "IRG-09",
    0
  ],
  "igualdade:40": [
    "IRG-10",
    0
  ],
  "igualdade:41": [
    "IRG-11",
    0
  ],
  "igualdade:42": [
    "IRG-12",
    0
  ],
  "dpm:0": [
    "DPM-01",
    0
  ],
  "dpm:1": [
    "DPM-01",
    0
  ],
  "dpm:2": [
    "DPM-01",
    0
  ],
  "dpm:3": [
    "DPM-01",
    0
  ],
  "dpm:4": [
    "DPM-01",
    0
  ],
  "dpm:5": [
    "DPM-08",
    0
  ],
  "dpm:6": [
    "DPM-09",
    0
  ],
  "dpm:7": [
    "DPM-09",
    0
  ],
  "redacao:0": [
    "RED-01",
    0
  ],
  "redacao:1": [
    "RED-01",
    0
  ],
  "redacao:2": [
    "RED-01",
    1
  ],
  "redacao:3": [
    "RED-01",
    2
  ],
  "redacao:4": [
    "RED-01",
    2
  ],
  "redacao:5": [
    "RED-01",
    3
  ],
  "redacao:6": [
    "RED-01",
    3
  ],
  "redacao:7": [
    "RED-01",
    4
  ],
  "redacao:8": [
    "RED-01",
    4
  ],
  "redacao:9": [
    "RED-01",
    5
  ],
  "redacao:10": [
    "RED-01",
    5
  ],
  "redacao:11": [
    "RED-01",
    5
  ]
};
