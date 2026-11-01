import type { ResourceKind } from "@/api/types";
import type { AccentName } from "@/theme/colors";
import type { FeatherName } from "@/components/ui";

export interface KindMeta {
  kind: ResourceKind;
  /** Plural, for headings. */
  title: string;
  /** Singular, for buttons and counts. */
  noun: string;
  accent: Exclude<AccentName, "primary" | "sky">;
  icon: FeatherName;
  description: string;
  viewLabel: string;
  codePlaceholder: string;
  /** What the "title" field of an upload should look like. */
  titleHint: string;
  /** Whether uploads carry an academic year. */
  hasYear: boolean;
}

export const KIND_META: Record<ResourceKind, KindMeta> = {
  pyqs: {
    kind: "pyqs",
    title: "Question papers",
    noun: "Paper",
    accent: "coral",
    icon: "file-text",
    description: "Past exam papers from every school at Sharda University — filter by programme, semester, year or course code.",
    viewLabel: "View paper",
    codePlaceholder: "e.g. CSE252",
    titleHint: "e.g. Computer Networks — End Term 2024-25",
    hasYear: true,
  },
  notes: {
    kind: "notes",
    title: "Notes",
    noun: "Note",
    accent: "mint",
    icon: "book",
    description: "Unit-wise study notes written and shared by students who have already sat the paper.",
    viewLabel: "View note",
    codePlaceholder: "e.g. CSE249",
    titleHint: "e.g. DBMS Unit 3 — Normalisation",
    hasYear: true,
  },
  syllabus: {
    kind: "syllabus",
    title: "Syllabus",
    noun: "Syllabus",
    accent: "purple",
    icon: "list",
    description: "The official unit breakdown for each course, so you know what is examinable before you start revising.",
    viewLabel: "View syllabus",
    codePlaceholder: "e.g. CSE251",
    titleHint: "e.g. Theory of Computation syllabus",
    hasYear: false,
  },
};

export const KIND_ORDER: ResourceKind[] = ["pyqs", "notes", "syllabus"];

export const isResourceKind = (v: unknown): v is ResourceKind => v === "pyqs" || v === "notes" || v === "syllabus";

export const SEMESTERS = Array.from({ length: 12 }, (_, i) => String(i + 1));

/** Recent academic years, newest first, for filters and the upload form. */
export const academicYears = (count = 8) => {
  const now = new Date();
  // Academic years start in July.
  const start = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
  return Array.from({ length: count }, (_, i) => {
    const y = start + 1 - i;
    return `${y}-${String((y + 1) % 100).padStart(2, "0")}`;
  });
};

/** "Unit 3" from "UNIT 3 CSE114 Python.pdf"; the bare filename otherwise. */
export function unitLabel(fileName: string, index: number, total: number): string {
  const match = fileName.match(/^(?:unit)\s*([\d.]+)/i);
  if (match) return `Unit ${match[1]}`;
  return total > 1 ? `Part ${index + 1}` : "Document";
}
