import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  BookOpen, Calculator, Monitor, Landmark, Map as MapIcon, Newspaper,
  Scale, Users, Building2, Gavel, ShieldAlert, PenTool, CheckCircle2,
  Circle, RotateCcw, Settings2, CalendarDays, ListChecks, TrendingUp,
  ChevronLeft, ChevronRight
} from "lucide-react";

// ---------------------------------------------------------------------------
// DADOS DO EDITAL — SOLDADO PM-BA (FCC)
// Peso = relevância histórica (nº de questões da banca FCC no mesmo cargo)
// ---------------------------------------------------------------------------
const SUBJECTS = [
  { id: "portugues", name: "Língua Portuguesa", code: "LP", weight: 10, icon: BookOpen, group: "gerais",
    topics: [
      "Compreensão e interpretação de textos",
      "Tipologia textual e gêneros textuais",
      "Ortografia oficial + Acentuação gráfica",
      "Classes de palavras",
      "Uso do sinal indicativo de crase",
      "Sintaxe da oração e do período",
      "Pontuação + Concordância nominal e verbal",
      "Regência nominal e verbal + Significação das palavras",
    ]},
  { id: "matematica", name: "Matemática", code: "MAT", weight: 8, icon: Calculator, group: "gerais",
    topics: [
      "Conjuntos numéricos",
      "Álgebra",
      "Funções",
      "Sistemas lineares, matrizes e determinantes",
      "Análise combinatória",
      "Geometria e medidas",
      "Trigonometria",
    ]},
  { id: "informatica", name: "Informática", code: "INF", weight: 8, icon: Monitor, group: "gerais",
    topics: [
      "Aplicativos de escritório (Word/Writer, Excel/Calc, PowerPoint/Impress)",
      "Sistemas operacionais (Windows 7/10, Linux) + organização de arquivos",
      "Atalhos de teclado, ícones, área de trabalho, lixeira",
      "Internet, intranet, e-mail e computação em nuvem",
    ]},
  { id: "historia", name: "História do Brasil", code: "HIST", weight: 9, icon: Landmark, group: "gerais",
    topics: [
      "Descobrimento do Brasil + Brasil Colônia",
      "Independência do Brasil + Primeiro Reinado",
      "Segundo Reinado + Primeira República",
      "Revolução de 1930 + Era Vargas + Presidentes de 1964 à atualidade",
      "História da Bahia + Independência da Bahia + Sabinada + Conjuração Baiana",
      "Revolta de Canudos + Revolta dos Malês",
    ]},
  { id: "geografia", name: "Geografia do Brasil", code: "GEO", weight: 7, icon: MapIcon, group: "gerais",
    topics: [
      "Relevo brasileiro + Clima",
      "Urbanização + Fontes de energia",
      "Problemas ambientais + Geografia da Bahia",
    ]},
  { id: "atualidades", name: "Atualidades", code: "ATU", weight: 7, icon: Newspaper, group: "gerais",
    topics: [
      "Globalização",
      "Multiculturalidade, pluralidade e diversidade cultural",
      "Tecnologias de informação e comunicação",
    ]},
  { id: "dconst", name: "Direito Constitucional", code: "DCO", weight: 6, icon: Scale, group: "especificos",
    topics: [
      "Princípios fundamentais + Direitos e garantias fundamentais (CF)",
      "Organização do Estado + Administração Pública (CF)",
      "Militares dos Estados/DF/Territórios + Segurança Pública (CF)",
      "Constituição do Estado da Bahia (completa)",
    ]},
  { id: "dh", name: "Direitos Humanos", code: "DH", weight: 6, icon: Users, group: "especificos",
    topics: [
      "Declaração Universal dos Direitos Humanos/1948",
      "Convenção Americana sobre Direitos Humanos/1969 (Pacto de São José)",
      "Pacto Internacional dos Direitos Econômicos, Sociais e Culturais",
      "Declaração de Pequim",
    ]},
  { id: "dadmin", name: "Direito Administrativo", code: "DAD", weight: 5, icon: Building2, group: "especificos",
    topics: [
      "Administração Pública + Princípios fundamentais",
      "Poderes e deveres dos administradores públicos",
      "Servidores públicos + Estatuto dos PMs da Bahia",
    ]},
  { id: "dpenal", name: "Direito Penal", code: "DPE", weight: 7, icon: Gavel, group: "especificos",
    topics: [
      "Do crime: elementos, consumação/tentativa, causas de exclusão",
      "Contravenção + Crimes contra a vida",
      "Crimes contra a liberdade pessoal + patrimônio",
      "Crimes contra a dignidade sexual",
      "Corrupção ativa e passiva + Lei de Tortura (9.455/1997)",
    ]},
  { id: "igualdade", name: "Igualdade Racial e de Gênero", code: "IRG", weight: 3, icon: Users, group: "especificos",
    topics: [
      "CF art. 1º, 3º, 4º, 5º + Constituição da Bahia (Cap. XXIII \"Do Negro\")",
      "Estatuto da Igualdade Racial + Leis de crimes raciais + Lei Caó",
      "Convenções internacionais (discriminação racial e contra a mulher)",
      "Lei Maria da Penha + CP art. 140 + Lei de Tortura",
      "Legislação estadual/federal de promoção da igualdade racial",
    ]},
  { id: "dpm", name: "Direito Penal Militar", code: "DPM", weight: 5, icon: ShieldAlert, group: "especificos",
    topics: [
      "Crimes contra autoridade/disciplina militar + violência contra superior",
      "Desrespeito a superior + recusa de obediência + reunião ilícita + resistência",
      "Crimes contra o serviço militar e o dever militar",
      "Crimes contra a Administração Militar + dever funcional",
    ]},
  { id: "redacao", name: "Redação", code: "RED", weight: 6, icon: PenTool, group: "redacao",
    topics: [
      "Tema: Segurança pública e cidadania",
      "Tema: Direitos humanos e atuação policial",
      "Tema: Tecnologia e criminalidade",
      "Tema: Diversidade e igualdade racial/de gênero",
      "Tema: Meio ambiente e sociedade",
      "Tema: Ética no serviço público",
    ]},
];

const SUBJECT_MAP = Object.fromEntries(SUBJECTS.map(s => [s.id, s]));
const DAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const DAY_LABELS_FULL = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

const DEFAULT_SETTINGS = { activeDays: [1, 2, 3, 4, 5, 6], blocksPerDay: 3 };

// ---------------------------------------------------------------------------
// DATE HELPERS
// ---------------------------------------------------------------------------
function isoDay(date) { const d = date.getDay(); return d === 0 ? 7 : d; }
function getMonday(date) {
  const d = new Date(date);
  const diff = isoDay(d) - 1;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
function fmtDate(date) {
  const y = date.getFullYear(), m = String(date.getMonth() + 1).padStart(2, "0"), d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
function fmtDateDisplay(date) {
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

// ---------------------------------------------------------------------------
// GERAÇÃO DO CICLO — distribuição ponderada + espalhamento (evita agrupar
// a mesma matéria em blocos vizinhos)
// ---------------------------------------------------------------------------
function distributeSlots(counts, totalSlots) {
  // counts: [{id, count}] já somando totalSlots
  const sorted = [...counts].sort((a, b) => b.count - a.count);
  const result = new Array(totalSlots).fill(null);
  sorted.forEach(({ id, count }) => {
    if (count <= 0) return;
    for (let i = 0; i < count; i++) {
      let pos = Math.round((i * totalSlots) / count);
      pos = Math.min(pos, totalSlots - 1);
      while (result[pos] !== null) pos = (pos + 1) % totalSlots;
      result[pos] = id;
    }
  });
  return result;
}

function allocateWeights(activeSubjectIds, totalSlots) {
  const subs = SUBJECTS.filter(s => activeSubjectIds.includes(s.id));
  const totalWeight = subs.reduce((a, s) => a + s.weight, 0);
  const raw = subs.map(s => ({ id: s.id, exact: (s.weight / totalWeight) * totalSlots }));
  const floors = raw.map(r => ({ id: r.id, count: Math.floor(r.exact), rem: r.exact - Math.floor(r.exact) }));
  let used = floors.reduce((a, f) => a + f.count, 0);
  let remaining = totalSlots - used;
  const byRem = [...floors].sort((a, b) => b.rem - a.rem);
  for (let i = 0; i < remaining; i++) byRem[i % byRem.length].count += 1;
  return floors.map(f => ({ id: f.id, count: byRem.find(b => b.id === f.id).count }));
}

function generateWeekSchedule(settings, pointers) {
  const { activeDays, blocksPerDay } = settings;
  const totalSlots = activeDays.length * blocksPerDay;
  if (totalSlots === 0) return { schedule: [], newPointers: pointers };

  const allIds = SUBJECTS.map(s => s.id);
  const counts = allocateWeights(allIds, totalSlots);
  const flatAssignment = distributeSlots(counts, totalSlots);

  const localPointers = { ...pointers };
  const schedule = activeDays.map(dayNum => ({ day: dayNum, blocks: [] }));

  flatAssignment.forEach((subjId, idx) => {
    const dayIdx = Math.floor(idx / blocksPerDay);
    const subject = SUBJECT_MAP[subjId];
    const ptr = localPointers[subjId] ?? 0;
    const lap = Math.floor(ptr / subject.topics.length) + 1;
    const topicIdx = ptr % subject.topics.length;
    schedule[dayIdx].blocks.push({
      subjectId: subjId,
      topicIndex: topicIdx,
      lap,
    });
    localPointers[subjId] = ptr + 1;
  });

  return { schedule, newPointers: localPointers };
}

// ---------------------------------------------------------------------------
// PERSISTÊNCIA
// ---------------------------------------------------------------------------
async function loadJSON(key, fallback) {
  try {
    const res = await window.storage.get(key, false);
    return res ? JSON.parse(res.value) : fallback;
  } catch {
    return fallback;
  }
}
async function saveJSON(key, value) {
  try { await window.storage.set(key, JSON.stringify(value), false); } catch {}
}

// ---------------------------------------------------------------------------
// UI TOKENS
// ---------------------------------------------------------------------------
const C = {
  bg: "#12161A",
  surface: "#1B2126",
  surfaceAlt: "#212930",
  border: "#2C363E",
  text: "#EDEAE0",
  textDim: "#94A0AA",
  gold: "#D4A73A",
  goldDim: "#8A7127",
  red: "#B4453D",
  green: "#5A8C6E",
};
const displayFont = "Georgia, 'Times New Roman', serif";
const monoFont = "'SF Mono', 'Courier New', monospace";

function Chip({ children, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 text-xs tracking-wide rounded transition-colors"
      style={{
        fontFamily: monoFont,
        border: `1px solid ${active ? C.gold : C.border}`,
        color: active ? C.gold : C.textDim,
        background: active ? "rgba(212,167,58,0.08)" : "transparent",
      }}
    >
      {children}
    </button>
  );
}

function TopicBlock({ subjectId, topicIndex, lap, completed, onToggle }) {
  const subject = SUBJECT_MAP[subjectId];
  const Icon = subject.icon;
  const topic = subject.topics[topicIndex];
  return (
    <div
      className="p-4 rounded flex items-start gap-3"
      style={{ background: C.surface, border: `1px solid ${completed ? C.goldDim : C.border}` }}
    >
      <button onClick={onToggle} className="mt-0.5 shrink-0" aria-label={completed ? "Marcar como pendente" : "Marcar como concluído"}>
        {completed
          ? <CheckCircle2 size={20} color={C.gold} />
          : <Circle size={20} color={C.textDim} />}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Icon size={14} color={C.gold} />
          <span className="text-xs uppercase tracking-wider" style={{ fontFamily: monoFont, color: C.gold }}>
            {subject.code}-{String(topicIndex + 1).padStart(2, "0")}
          </span>
          {lap > 1 && (
            <span className="text-xs px-1.5 py-0.5 rounded" style={{ fontFamily: monoFont, color: C.textDim, border: `1px solid ${C.border}` }}>
              {lap}ª volta
            </span>
          )}
        </div>
        <div className="text-xs mb-1" style={{ color: C.textDim }}>{subject.name}</div>
        <div
          className="text-sm leading-snug"
          style={{ color: completed ? C.textDim : C.text, textDecoration: completed ? "line-through" : "none" }}
        >
          {topic}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// APP
// ---------------------------------------------------------------------------
export default function App() {
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState("hoje");
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [pointers, setPointers] = useState({});
  const [weekData, setWeekData] = useState(null); // { weekStart, schedule }
  const [completed, setCompleted] = useState({}); // "subjId:topicIdx" -> true

  // ---- init load ----
  useEffect(() => {
    (async () => {
      const [s, p, w, c] = await Promise.all([
        loadJSON("pmba:settings", DEFAULT_SETTINGS),
        loadJSON("pmba:pointers", {}),
        loadJSON("pmba:currentWeek", null),
        loadJSON("pmba:completed", {}),
      ]);
      setSettings(s);
      setPointers(p);
      setCompleted(c);

      const monday = fmtDate(getMonday(new Date()));
      if (!w || w.weekStart !== monday) {
        const { schedule, newPointers } = generateWeekSchedule(s, p);
        const nw = { weekStart: monday, schedule };
        setWeekData(nw);
        setPointers(newPointers);
        await saveJSON("pmba:currentWeek", nw);
        await saveJSON("pmba:pointers", newPointers);
      } else {
        setWeekData(w);
      }
      setLoaded(true);
    })();
  }, []);

  const regenerate = useCallback(async (newSettings) => {
    const monday = fmtDate(getMonday(new Date()));
    const { schedule, newPointers } = generateWeekSchedule(newSettings, pointers);
    const nw = { weekStart: monday, schedule };
    setSettings(newSettings);
    setWeekData(nw);
    setPointers(newPointers);
    await saveJSON("pmba:settings", newSettings);
    await saveJSON("pmba:currentWeek", nw);
    await saveJSON("pmba:pointers", newPointers);
  }, [pointers]);

  const toggleTopic = useCallback((subjectId, topicIndex) => {
    setCompleted(prev => {
      const key = `${subjectId}:${topicIndex}`;
      const next = { ...prev, [key]: !prev[key] };
      saveJSON("pmba:completed", next);
      return next;
    });
  }, []);

  const toggleDay = (dayNum) => {
    const has = settings.activeDays.includes(dayNum);
    const next = has ? settings.activeDays.filter(d => d !== dayNum) : [...settings.activeDays, dayNum].sort();
    regenerate({ ...settings, activeDays: next });
  };
  const setBlocksPerDay = (n) => regenerate({ ...settings, blocksPerDay: n });

  const todayIso = isoDay(new Date());
  const todayBlocks = useMemo(() => {
    if (!weekData) return [];
    const d = weekData.schedule.find(d => d.day === todayIso);
    return d ? d.blocks : [];
  }, [weekData, todayIso]);

  const weekProgress = useMemo(() => {
    if (!weekData) return { done: 0, total: 0 };
    let done = 0, total = 0;
    weekData.schedule.forEach(d => d.blocks.forEach(b => {
      total++;
      if (completed[`${b.subjectId}:${b.topicIndex}`]) done++;
    }));
    return { done, total };
  }, [weekData, completed]);

  if (!loaded) {
    return (
      <div className="flex items-center justify-center h-96" style={{ background: C.bg, color: C.textDim, fontFamily: monoFont }}>
        carregando ciclo...
      </div>
    );
  }

  return (
    <div style={{ background: C.bg, minHeight: "100%", color: C.text }} className="w-full">
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 4px; }
      `}</style>

      {/* HEADER */}
      <div className="px-6 pt-6 pb-4" style={{ borderBottom: `1px solid ${C.border}` }}>
        <div className="flex items-baseline justify-between flex-wrap gap-2">
          <div>
            <div className="text-xs uppercase tracking-widest mb-1" style={{ fontFamily: monoFont, color: C.gold }}>
              Edital Soldado PM-BA · FCC
            </div>
            <h1 className="text-2xl" style={{ fontFamily: displayFont, fontWeight: 700 }}>
              Ciclo de Estudos
            </h1>
          </div>
          <div className="text-right">
            <div className="text-xs" style={{ color: C.textDim, fontFamily: monoFont }}>Semana atual</div>
            <div className="text-sm" style={{ fontFamily: monoFont, color: C.gold }}>
              {weekProgress.done}/{weekProgress.total} blocos concluídos
            </div>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="px-6 pt-4 flex gap-1 flex-wrap">
        {[
          { id: "hoje", label: "Hoje", icon: CalendarDays },
          { id: "semana", label: "Semana", icon: ListChecks },
          { id: "materias", label: "Matérias", icon: BookOpen },
          { id: "progresso", label: "Progresso", icon: TrendingUp },
          { id: "config", label: "Configurar", icon: Settings2 },
        ].map(t => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-t"
              style={{
                color: active ? C.text : C.textDim,
                borderBottom: `2px solid ${active ? C.gold : "transparent"}`,
                fontFamily: monoFont,
              }}
            >
              <Icon size={14} /> {t.label}
            </button>
          );
        })}
      </div>

      <div className="p-6">
        {tab === "hoje" && (
          <div>
            <div className="mb-4 text-sm" style={{ color: C.textDim }}>
              {DAY_LABELS_FULL[todayIso - 1]}, {fmtDateDisplay(new Date())}
            </div>
            {todayBlocks.length === 0 ? (
              <div className="p-6 rounded text-center" style={{ background: C.surface, border: `1px dashed ${C.border}`, color: C.textDim }}>
                Dia livre no seu ciclo — sem blocos programados hoje.
              </div>
            ) : (
              <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
                {todayBlocks.map((b, i) => (
                  <TopicBlock
                    key={i}
                    subjectId={b.subjectId}
                    topicIndex={b.topicIndex}
                    lap={b.lap}
                    completed={!!completed[`${b.subjectId}:${b.topicIndex}`]}
                    onToggle={() => toggleTopic(b.subjectId, b.topicIndex)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "semana" && weekData && (
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))" }}>
            {weekData.schedule.map(day => (
              <div key={day.day}>
                <div
                  className="text-xs uppercase tracking-widest mb-2 pb-1"
                  style={{ fontFamily: monoFont, color: day.day === todayIso ? C.gold : C.textDim, borderBottom: `1px solid ${C.border}` }}
                >
                  {DAY_LABELS[day.day - 1]} {day.day === todayIso && "· hoje"}
                </div>
                <div className="flex flex-col gap-2">
                  {day.blocks.map((b, i) => (
                    <TopicBlock
                      key={i}
                      subjectId={b.subjectId}
                      topicIndex={b.topicIndex}
                      lap={b.lap}
                      completed={!!completed[`${b.subjectId}:${b.topicIndex}`]}
                      onToggle={() => toggleTopic(b.subjectId, b.topicIndex)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "materias" && (
          <div className="flex flex-col gap-6">
            {SUBJECTS.map(subject => {
              const Icon = subject.icon;
              const doneCount = subject.topics.filter((_, i) => completed[`${subject.id}:${i}`]).length;
              return (
                <div key={subject.id}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon size={16} color={C.gold} />
                    <span style={{ fontFamily: displayFont, fontWeight: 700, fontSize: "1.05rem" }}>{subject.name}</span>
                    <span className="text-xs ml-auto" style={{ fontFamily: monoFont, color: C.textDim }}>
                      {doneCount}/{subject.topics.length} · peso {subject.weight}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {subject.topics.map((topic, i) => {
                      const done = !!completed[`${subject.id}:${i}`];
                      return (
                        <button
                          key={i}
                          onClick={() => toggleTopic(subject.id, i)}
                          className="flex items-center gap-2 p-2 rounded text-left text-sm"
                          style={{ background: C.surface, border: `1px solid ${C.border}` }}
                        >
                          {done ? <CheckCircle2 size={16} color={C.gold} /> : <Circle size={16} color={C.textDim} />}
                          <span className="text-xs" style={{ fontFamily: monoFont, color: C.textDim }}>
                            {subject.code}-{String(i + 1).padStart(2, "0")}
                          </span>
                          <span style={{ color: done ? C.textDim : C.text, textDecoration: done ? "line-through" : "none" }}>
                            {topic}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === "progresso" && (
          <div className="flex flex-col gap-3">
            {SUBJECTS.map(subject => {
              const Icon = subject.icon;
              const total = subject.topics.length;
              const done = subject.topics.filter((_, i) => completed[`${subject.id}:${i}`]).length;
              const pct = Math.round((done / total) * 100);
              const laps = Math.floor((pointers[subject.id] ?? 0) / total);
              return (
                <div key={subject.id} className="p-3 rounded" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                  <div className="flex items-center gap-2 mb-2 text-sm">
                    <Icon size={14} color={C.gold} />
                    <span>{subject.name}</span>
                    <span className="ml-auto text-xs" style={{ fontFamily: monoFont, color: C.textDim }}>
                      {done}/{total} {laps > 0 && `· ${laps + 1}ª volta em andamento`}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full w-full overflow-hidden" style={{ background: C.surfaceAlt }}>
                    <div className="h-full" style={{ width: `${pct}%`, background: C.gold }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === "config" && (
          <div className="max-w-md flex flex-col gap-6">
            <div>
              <div className="text-xs uppercase tracking-widest mb-2" style={{ fontFamily: monoFont, color: C.textDim }}>
                Dias de estudo
              </div>
              <div className="flex gap-2 flex-wrap">
                {DAY_LABELS.map((label, i) => (
                  <Chip key={i} active={settings.activeDays.includes(i + 1)} onClick={() => toggleDay(i + 1)}>
                    {label}
                  </Chip>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest mb-2" style={{ fontFamily: monoFont, color: C.textDim }}>
                Blocos de estudo por dia (1h cada)
              </div>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map(n => (
                  <Chip key={n} active={settings.blocksPerDay === n} onClick={() => setBlocksPerDay(n)}>
                    {n}h
                  </Chip>
                ))}
              </div>
            </div>
            <div className="p-3 rounded text-xs flex items-start gap-2" style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.textDim }}>
              <RotateCcw size={14} className="mt-0.5 shrink-0" />
              <span>
                Mudar essas opções gera um novo cronograma para a semana atual, mas o progresso de cada
                matéria (quantos assuntos já foram vistos) é preservado.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
