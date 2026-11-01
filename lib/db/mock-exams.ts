import "server-only";

import { isPointsPerQuestion, parseMockResults } from "@/lib/mock-exams";
import { isIsoDate } from "@/lib/state-schema";
import type { MockExam, MockResult } from "@/lib/types";

import { db, DatabaseError } from "./client";

interface MockExamRow {
  id: string;
  title: string | null;
  taken_on: string;
  points_per_question: number | string | null;
  results: unknown;
}

/** Sem a migração 0007, as colunas de nome e pontuação não existem: lê só as do 0005. */
const COLUMNS = "id, title, taken_on, points_per_question, results";
const BASE_COLUMNS = "id, taken_on, results";

function toMockExam(row: MockExamRow): MockExam | null {
  if (!isIsoDate(row.taken_on)) return null;
  const results = parseMockResults(row.results);
  // Simulado só com matérias que saíram do edital: nada a mostrar.
  if (Object.keys(results).length === 0) return null;
  // `numeric` chega do banco como texto.
  const points = Number(row.points_per_question ?? 1);
  return {
    id: row.id,
    title: typeof row.title === "string" && row.title.trim() !== "" ? row.title.trim() : null,
    takenOn: row.taken_on,
    pointsPerQuestion: isPointsPerQuestion(points) ? points : 1,
    results,
  };
}

/**
 * Simulados do perfil, do mais antigo para o mais novo.
 *
 * Falha aqui não derruba o app: sem a migração 0005 a tabela não existe, e o
 * ciclo precisa continuar abrindo. O erro vai para o log do servidor.
 */
export async function loadMockExams(profileId: string): Promise<MockExam[]> {
  const query = (columns: string) =>
    db()
      .from("mock_exams")
      .select(columns)
      .eq("profile_id", profileId)
      .order("taken_on", { ascending: true })
      .order("created_at", { ascending: true });

  let { data, error } = await query(COLUMNS);
  if (error) ({ data, error } = await query(BASE_COLUMNS));
  if (error) {
    console.error("[db:mock_exams]", error.message);
    return [];
  }
  return ((data as unknown as MockExamRow[] | null) ?? [])
    .map(toMockExam)
    .filter((e): e is MockExam => e !== null);
}

export async function insertMockExam(
  profileId: string,
  exam: Omit<MockExam, "id"> & { results: Record<string, MockResult> },
): Promise<MockExam> {
  const { data, error } = await db()
    .from("mock_exams")
    .insert({
      profile_id: profileId,
      title: exam.title,
      taken_on: exam.takenOn,
      points_per_question: exam.pointsPerQuestion,
      results: exam.results,
    })
    .select(COLUMNS)
    .single();

  if (error) throw new DatabaseError("lançar o simulado", error.message);
  const saved = toMockExam(data as MockExamRow);
  if (!saved) throw new DatabaseError("lançar o simulado", "o banco devolveu um registro inválido");
  return saved;
}

/** Filtra pelo perfil também: um id de outro perfil simplesmente não apaga nada. */
export async function deleteMockExam(profileId: string, id: string): Promise<void> {
  const { error } = await db().from("mock_exams").delete().match({ profile_id: profileId, id });
  if (error) throw new DatabaseError("apagar o simulado", error.message);
}
