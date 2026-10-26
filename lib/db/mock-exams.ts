import "server-only";

import { parseMockResults } from "@/lib/mock-exams";
import { isIsoDate } from "@/lib/state-schema";
import type { MockExam, MockResult } from "@/lib/types";

import { db, DatabaseError } from "./client";

interface MockExamRow {
  id: string;
  taken_on: string;
  results: unknown;
}

const COLUMNS = "id, taken_on, results";

function toMockExam(row: MockExamRow): MockExam | null {
  if (!isIsoDate(row.taken_on)) return null;
  const results = parseMockResults(row.results);
  // Simulado só com matérias que saíram do edital: nada a mostrar.
  if (Object.keys(results).length === 0) return null;
  return { id: row.id, takenOn: row.taken_on, results };
}

/**
 * Simulados do perfil, do mais antigo para o mais novo.
 *
 * Falha aqui não derruba o app: sem a migração 0005 a tabela não existe, e o
 * ciclo precisa continuar abrindo. O erro vai para o log do servidor.
 */
export async function loadMockExams(profileId: string): Promise<MockExam[]> {
  const { data, error } = await db()
    .from("mock_exams")
    .select(COLUMNS)
    .eq("profile_id", profileId)
    .order("taken_on", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[db:mock_exams]", error.message);
    return [];
  }
  return ((data as MockExamRow[] | null) ?? [])
    .map(toMockExam)
    .filter((e): e is MockExam => e !== null);
}

export async function insertMockExam(
  profileId: string,
  takenOn: string,
  results: Record<string, MockResult>,
): Promise<MockExam> {
  const { data, error } = await db()
    .from("mock_exams")
    .insert({ profile_id: profileId, taken_on: takenOn, results })
    .select(COLUMNS)
    .single();

  if (error) throw new DatabaseError("lançar o simulado", error.message);
  const exam = toMockExam(data as MockExamRow);
  if (!exam) throw new DatabaseError("lançar o simulado", "o banco devolveu um registro inválido");
  return exam;
}

/** Filtra pelo perfil também: um id de outro perfil simplesmente não apaga nada. */
export async function deleteMockExam(profileId: string, id: string): Promise<void> {
  const { error } = await db().from("mock_exams").delete().match({ profile_id: profileId, id });
  if (error) throw new DatabaseError("apagar o simulado", error.message);
}
