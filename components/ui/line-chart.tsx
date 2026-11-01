"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";

import type { EvolutionPoint } from "@/lib/evolution";

interface LineChartProps {
  points: readonly EvolutionPoint[];
  /** Descrição para leitor de tela, ex.: "Acerto nos simulados". */
  label: string;
  /** Texto quando não há pontos. */
  empty: string;
}

const HEIGHT = 200;
const PAD = { top: 16, right: 40, bottom: 26, left: 38 };
const GRID = [0, 25, 50, 75, 100];
/** Rótulos do eixo x no máximo; o resto aparece no tooltip. */
const MAX_X_LABELS = 6;

/**
 * Gráfico de linha de uma série em percentual (eixo fixo de 0 a 100%). Linha
 * de 2px, pontos de 8px com anel na cor da superfície, grade discreta, o
 * último valor escrito na ponta e tooltip com cruz ao passar o dedo ou o
 * mouse. A tabela abaixo traz os mesmos números para quem não vê o gráfico.
 */
export function LineChart({ points, label, empty }: LineChartProps) {
  const wrapper = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);
  const [hover, setHover] = useState<number | null>(null);
  const isEmpty = points.length === 0;

  useEffect(() => {
    const el = wrapper.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(240, entry.contentRect.width)));
    observer.observe(el);
    return () => observer.disconnect();
    // Religa quando o gráfico sai do estado vazio: antes disso não há o que medir.
  }, [isEmpty]);

  if (isEmpty) {
    return (
      <div className="border-line text-muted rounded-2xl border border-dashed p-5 text-center text-sm">
        {empty}
      </div>
    );
  }

  const plotW = width - PAD.left - PAD.right;
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (points.length === 1 ? plotW / 2 : (i * plotW) / (points.length - 1));
  const y = (v: number) => PAD.top + plotH - (v / 100) * plotH;
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
  const step = Math.max(1, Math.ceil(points.length / MAX_X_LABELS));
  const last = points.length - 1;
  const active = hover;

  function onMove(event: PointerEvent<SVGRectElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    // A área de toque começa 12px antes do gráfico.
    const px = event.clientX - box.left + PAD.left - 12;
    let nearest = 0;
    for (let i = 1; i < points.length; i++) if (Math.abs(x(i) - px) < Math.abs(x(nearest) - px)) nearest = i;
    setHover(nearest);
  }

  return (
    <div className="flex flex-col gap-2">
      <div ref={wrapper} className="relative w-full">
        <svg width={width} height={HEIGHT} role="img" aria-label={label} className="block overflow-visible">
          {GRID.map((g) => (
            <g key={g}>
              <line x1={PAD.left} x2={PAD.left + plotW} y1={y(g)} y2={y(g)} className="stroke-line" strokeWidth={1} />
              <text x={PAD.left - 8} y={y(g)} dy="0.32em" textAnchor="end" className="fill-muted text-[10px] tabular-nums">
                {g}%
              </text>
            </g>
          ))}

          {points.map((p, i) =>
            i % step === 0 || i === last ? (
              <text key={i} x={x(i)} y={HEIGHT - 6} textAnchor="middle" className="fill-muted text-[10px] tabular-nums">
                {p.label}
              </text>
            ) : null,
          )}

          {active !== null && (
            <line x1={x(active)} x2={x(active)} y1={PAD.top} y2={PAD.top + plotH} className="stroke-muted" strokeWidth={1} strokeDasharray="3 3" />
          )}

          <path d={path} fill="none" className="stroke-accent-text" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {points.map((p, i) => (
            <circle
              key={i}
              cx={x(i)}
              cy={y(p.value)}
              r={active === i ? 6 : 4}
              className="fill-accent-text stroke-surface"
              strokeWidth={2}
            />
          ))}

          {/* Rótulo direto só no último ponto: o valor mais recente. */}
          <text x={x(last) + 9} y={y(points[last].value)} dy="0.32em" className="fill-ink text-[11px] font-bold tabular-nums">
            {points[last].value}%
          </text>

          {/* Área de toque maior que os pontos, para mouse e dedo. */}
          <rect
            x={PAD.left - 12}
            y={0}
            width={plotW + 24}
            height={HEIGHT}
            fill="transparent"
            onPointerMove={onMove}
            onPointerDown={onMove}
            onPointerLeave={() => setHover(null)}
          />
        </svg>

        {active !== null && (
          <div
            role="status"
            className="bg-frame border-line pointer-events-none absolute top-0 z-10 rounded-lg border px-2.5 py-1.5 text-xs shadow-lg"
            style={{
              left: Math.min(Math.max(x(active) - 70, 0), width - 140),
              width: 140,
            }}
          >
            <p className="text-muted tabular-nums">{points[active].label}</p>
            <p className="font-bold tabular-nums">{points[active].value}%</p>
            <p className="text-muted">{points[active].detail}</p>
          </div>
        )}
      </div>

      <details className="text-sm">
        <summary className="text-muted hover:text-ink w-fit cursor-pointer text-xs font-semibold">Ver em tabela</summary>
        <table className="mt-2 w-full text-left text-xs tabular-nums">
          <thead className="text-muted">
            <tr>
              <th className="py-1 font-medium">Data</th>
              <th className="py-1 font-medium">%</th>
              <th className="py-1 font-medium">Detalhe</th>
            </tr>
          </thead>
          <tbody>
            {points.map((p, i) => (
              <tr key={i} className="border-line border-t">
                <td className="py-1">{p.label}</td>
                <td className="py-1 font-semibold">{p.value}%</td>
                <td className="text-muted py-1">{p.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
