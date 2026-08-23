import {
  BookOpen,
  Building2,
  Calculator,
  Gavel,
  Landmark,
  Map,
  Monitor,
  Newspaper,
  PenTool,
  Scale,
  ShieldAlert,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { SubjectIconName } from "@/lib/types";

/**
 * Mapa nome → componente. Manter os ícones fora de `lib/subjects.ts` deixa os
 * dados do edital como JSON puro, serializável e utilizável no servidor.
 */
const SUBJECT_ICONS: Record<SubjectIconName, LucideIcon> = {
  book: BookOpen,
  calculator: Calculator,
  monitor: Monitor,
  landmark: Landmark,
  map: Map,
  newspaper: Newspaper,
  scale: Scale,
  users: Users,
  building: Building2,
  gavel: Gavel,
  shield: ShieldAlert,
  pen: PenTool,
};

export function getSubjectIcon(name: SubjectIconName): LucideIcon {
  return SUBJECT_ICONS[name];
}
