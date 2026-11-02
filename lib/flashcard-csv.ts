import { flashcardError } from "./flashcards";
import { SUBJECTS, topicCode } from "./subjects";
import type { Subject } from "./types";

/**
 * Importação de flashcards por planilha (CSV).
 *
 * O modelo traz uma linha por tópico do edital, com matéria, código e assunto
 * já preenchidos: é só escrever frente e verso nas linhas que interessam (e
 * copiar a linha para ter mais de um cartão no mesmo tópico). Linha com frente
 * e verso em branco é ignorada. Separador `;`, que é o que o Excel em
 * português abre direto; na leitura, `,` e tabulação também valem.
 */

export const MAX_IMPORT_CARDS = 500;
/** Arquivo maior que isso não é planilha de flashcards. */
export const MAX_IMPORT_BYTES = 2 * 1024 * 1024;

const HEADER = ["materia", "topico", "assunto", "frente", "verso"] as const;

/** Um cartão pronto para criar, com a linha da planilha de onde veio. */
export interface ImportedCard {
  line: number;
  subjectId: string;
  topicIndex: number | null;
  front: string;
  back: string;
}

export interface ImportResult {
  cards: ImportedCard[];
  errors: { line: number; message: string }[];
  /** Linhas sem frente nem verso (as do modelo que não foram usadas). */
  skipped: number;
}

function csvField(value: string): string {
  return /[";\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** O modelo: cabeçalho e uma linha por tópico. Começa com BOM para o Excel ler os acentos. */
export function flashcardTemplate(): string {
  const lines = [HEADER.join(";")];
  for (const subject of SUBJECTS) {
    subject.topics.forEach((topic, index) => {
      lines.push([subject.name, topicCode(subject, index), topic, "", ""].map(csvField).join(";"));
    });
  }
  return `﻿${lines.join("\r\n")}\r\n`;
}

/** Lê CSV com aspas (inclusive quebra de linha dentro delas). Devolve as linhas e o nº da linha no arquivo. */
export function parseCsv(text: string): { cells: string[]; line: number }[] {
  const source = text.replace(/^﻿/, "");
  const firstLine = source.split(/\r?\n/, 1)[0] ?? "";
  const delimiter = [";", "\t", ","].reduce((best, d) =>
    firstLine.split(d).length > firstLine.split(best).length ? d : best,
  );

  const rows: { cells: string[]; line: number }[] = [];
  let cells: string[] = [];
  let field = "";
  let quoted = false;
  let line = 1;
  let rowLine = 1;

  for (let i = 0; i < source.length; i++) {
    const ch = source[i];
    if (quoted) {
      if (ch === '"' && source[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        if (ch === "\n") line++;
        field += ch;
      }
    } else if (ch === '"' && field === "") {
      quoted = true;
    } else if (ch === delimiter) {
      cells.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && source[i + 1] === "\n") i++;
      cells.push(field);
      rows.push({ cells, line: rowLine });
      cells = [];
      field = "";
      line++;
      rowLine = line;
    } else {
      field += ch;
    }
  }
  if (field !== "" || cells.length > 0) {
    cells.push(field);
    rows.push({ cells, line: rowLine });
  }
  return rows;
}

const norm = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

/** Matéria pelo nome, pela sigla (LP) ou pelo id. */
function findSubjectLoose(value: string): Subject | undefined {
  const v = norm(value);
  return SUBJECTS.find((s) => norm(s.name) === v || norm(s.code) === v || s.id === v);
}

/** Tópico pelo código (LP-01) ou pelo número (1). */
function parseTopic(value: string, subject: Subject | undefined): { subject?: Subject; topic: number | null } | null {
  const v = value.trim().toUpperCase();
  if (v === "") return { subject, topic: null };
  const coded = v.match(/^([A-Z]+)-0*(\d+)$/);
  if (coded) {
    const bySymbol = SUBJECTS.find((s) => s.code === coded[1]);
    if (!bySymbol || (subject && bySymbol.id !== subject.id)) return null;
    return { subject: bySymbol, topic: Number(coded[2]) - 1 };
  }
  if (/^\d+$/.test(v) && subject) return { subject, topic: Number(v) - 1 };
  return null;
}

/**
 * Lê a planilha preenchida. Cada linha vira um cartão ou um erro com o número
 * da linha, para corrigir antes de importar; nada é criado aqui.
 */
export function parseFlashcardCsv(text: string): ImportResult {
  const rows = parseCsv(text);
  const result: ImportResult = { cards: [], errors: [], skipped: 0 };
  if (rows.length === 0) {
    result.errors.push({ line: 1, message: "Arquivo vazio." });
    return result;
  }

  const header = rows[0].cells.map(norm);
  const col = (name: string) => header.indexOf(name);
  const [iSubject, iTopic, iFront, iBack] = [col("materia"), col("topico"), col("frente"), col("verso")];
  if (iFront < 0 || iBack < 0 || (iSubject < 0 && iTopic < 0)) {
    result.errors.push({
      line: 1,
      message: "Cabeçalho diferente do modelo: precisa das colunas materia, topico, frente e verso.",
    });
    return result;
  }

  for (const { cells, line } of rows.slice(1)) {
    const cell = (i: number) => (i >= 0 ? (cells[i] ?? "").trim() : "");
    const front = cell(iFront);
    const back = cell(iBack);
    if (front === "" && back === "") {
      result.skipped++;
      continue;
    }

    const subjectText = cell(iSubject);
    const named = subjectText ? findSubjectLoose(subjectText) : undefined;
    if (subjectText && !named) {
      result.errors.push({ line, message: `Matéria "${subjectText}" não existe.` });
      continue;
    }
    const topic = parseTopic(cell(iTopic), named);
    if (!topic) {
      result.errors.push({ line, message: `Tópico "${cell(iTopic)}" não é dessa matéria.` });
      continue;
    }
    if (!topic.subject) {
      result.errors.push({ line, message: "Informe a matéria." });
      continue;
    }
    if (front === "" || back === "") {
      result.errors.push({ line, message: front === "" ? "Falta a frente." : "Falta o verso." });
      continue;
    }

    const invalid = flashcardError(topic.subject.id, topic.topic, front, back);
    if (invalid) {
      result.errors.push({ line, message: invalid });
      continue;
    }
    result.cards.push({ line, subjectId: topic.subject.id, topicIndex: topic.topic, front, back });
  }

  if (result.cards.length > MAX_IMPORT_CARDS) {
    result.errors.push({
      line: result.cards[MAX_IMPORT_CARDS].line,
      message: `No máximo ${MAX_IMPORT_CARDS} cartões por importação; divida o arquivo.`,
    });
    result.cards = result.cards.slice(0, MAX_IMPORT_CARDS);
  }
  return result;
}
