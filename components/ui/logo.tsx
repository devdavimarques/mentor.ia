interface LogoMarkProps {
  size?: number;
  /** Sem o quadrado de fundo: só o ciclo, na cor do texto. Para fundos já azuis. */
  bare?: boolean;
}

/** O ciclo quase fechado com um ponto na ponta: o ciclo de estudos e "onde você parou". */
export function LogoMark({ size = 32, bare = false }: LogoMarkProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden className="shrink-0">
      {!bare && <rect width="64" height="64" rx="16" className="fill-accent" />}
      <path
        d="M44.5 21.5A16 16 0 1 0 48 32"
        fill="none"
        stroke={bare ? "currentColor" : "#fff"}
        strokeWidth={bare ? 6 : 5.5}
        strokeLinecap="round"
      />
      <circle cx="48" cy="21" r={bare ? 4.5 : 4} fill={bare ? "currentColor" : "#fff"} />
    </svg>
  );
}

interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 32, className = "" }: LogoProps) {
  return (
    <span className={`flex items-center gap-2.5 font-extrabold tracking-tight ${className}`}>
      <LogoMark size={size} />
      <span>
        mentor<span className="text-accent-text">.ia</span>
      </span>
    </span>
  );
}
