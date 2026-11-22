import { findMaterial, downloadUrl } from "@/lib/resources";
import { currentProfile } from "@/lib/study-session";

// Arquivo grande do Drive pode levar um tempo para passar.
export const maxDuration = 60;

/**
 * Baixa um material da planilha de estudos pelo servidor do app: o Google vê
 * só um acesso anônimo, então não fica registro no Drive de quem baixou.
 *
 * Só serve os materiais listados em lib/topic-resources.ts (nada de endereço
 * vindo do navegador) e só para quem está logado.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ code: string; index: string }> }) {
  if (!(await currentProfile())) return new Response("Entre no seu perfil para baixar.", { status: 401 });

  const { code, index } = await params;
  const material = /^\d+$/.test(index) ? findMaterial(code, Number(index)) : null;
  const source = material?.material ? downloadUrl(material.material) : null;
  if (!material || !source) return new Response("Material não encontrado.", { status: 404 });

  const upstream = await fetch(source, { redirect: "follow", cache: "no-store" });
  const type = upstream.headers.get("content-type") ?? "";
  // Página HTML no lugar do arquivo: o Drive recusou (arquivo privado ou fora do ar).
  if (!upstream.ok || !upstream.body || type.startsWith("text/html")) {
    return new Response("O Drive não liberou este arquivo: ele não está compartilhado com \"qualquer pessoa com o link\", ou está fora do ar.", { status: 502 });
  }

  const fallbackName = `${material.name.replace(/[^\p{L}\p{N} ._-]+/gu, "").trim().slice(0, 80) || "material"}.${
    type.includes("pdf") ? "pdf" : type.includes("sheet") ? "xlsx" : "bin"
  }`;
  const headers = new Headers({
    "Content-Type": type || "application/octet-stream",
    "Content-Disposition":
      upstream.headers.get("content-disposition") ?? `attachment; filename*=UTF-8''${encodeURIComponent(fallbackName)}`,
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  });
  const length = upstream.headers.get("content-length");
  if (length) headers.set("Content-Length", length);
  return new Response(upstream.body, { headers });
}
