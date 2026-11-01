import { keepPreviousData, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import * as library from "@/api/library";
import type { LibraryResource, ResourceKind, SearchResult } from "@/api/types";
import { CURATED_NOTES, CURATED_PROGRAM, CURATED_SYLLABUS, CuratedItem } from "@/data/curated";

/**
 * One row in a library list, whether it came from the website's curated
 * files or from a student's approved upload.
 */
export interface LibraryEntry {
  key: string;
  kind: ResourceKind;
  title: string;
  code: string;
  semester: number;
  year?: string;
  program: string;
  /** More than one file for a multi-unit course. */
  files: string[];
  source: "curated" | "community";
  resourceId?: string;
  contributor?: string;
}

export interface LibraryFilters {
  query: string;
  program: string | null;
  courseCode: string;
  year: string | null;
  semester: string | null;
}

export const EMPTY_FILTERS: LibraryFilters = {
  query: "",
  program: null,
  courseCode: "",
  year: null,
  semester: null,
};

export const hasActiveFilters = (f: LibraryFilters) =>
  Boolean(f.query.trim() || f.program || f.courseCode.trim() || f.year || f.semester);

const fromCurated = (kind: ResourceKind, item: CuratedItem, index: number): LibraryEntry => ({
  key: `curated:${kind}:${item.code}:${item.semester}:${index}`,
  kind,
  title: item.subject,
  code: item.code,
  semester: item.semester,
  year: item.year,
  program: CURATED_PROGRAM,
  files: Array.isArray(item.src) ? item.src : [item.src],
  source: "curated",
});

export const fromResource = (kind: ResourceKind, r: LibraryResource): LibraryEntry => ({
  key: `${kind}:${r._id}`,
  kind,
  title: r.courseName || r.title,
  code: r.courseCode,
  semester: r.semester,
  year: r.year,
  program: r.program,
  files: [r.fileUrl],
  source: "community",
  resourceId: r._id,
  contributor: typeof r.userId === "object" ? r.userId.username : undefined,
});

const norm = (s: string) => s.replace(/\s+/g, "").toLowerCase();

function matchesCurated(item: CuratedItem, f: LibraryFilters) {
  const q = f.query.trim().toLowerCase();
  if (q && !item.subject.toLowerCase().includes(q) && !norm(item.code).includes(norm(q))) return false;
  if (f.program && f.program.toLowerCase() !== CURATED_PROGRAM.toLowerCase()) return false;
  if (f.courseCode.trim() && !norm(item.code).includes(norm(f.courseCode))) return false;
  if (f.year && item.year !== f.year) return false;
  if (f.semester && String(item.semester) !== f.semester) return false;
  return true;
}

/** Notes and syllabus: the curated lists merged with approved community uploads. */
export function useLibrary(kind: Exclude<ResourceKind, "pyqs">, filters: LibraryFilters, enabled = true) {
  const active = hasActiveFilters(filters);
  const curatedSource = kind === "notes" ? CURATED_NOTES : CURATED_SYLLABUS;

  const community = useQuery({
    queryKey: ["library", kind, active ? filters : "all"],
    queryFn: () =>
      active
        ? library.searchCommunity(kind, {
            query: filters.query.trim() || undefined,
            program: filters.program ?? undefined,
            courseCode: filters.courseCode.trim() || undefined,
            semester: filters.semester ?? undefined,
            year: filters.year ?? undefined,
          })
        : library.listCommunity(kind),
    placeholderData: keepPreviousData,
    enabled,
  });

  const entries = useMemo(() => {
    const curated = curatedSource
      .filter((item) => matchesCurated(item, filters))
      .map((item, i) => fromCurated(kind, item, i));
    const fromCommunity = (community.data ?? []).map((r) => fromResource(kind, r));
    return [...curated, ...fromCommunity];
  }, [curatedSource, community.data, filters, kind]);

  // Curated entries are always available, so the list is only "loading" when
  // there is genuinely nothing to show yet.
  const isLoading = community.isLoading && entries.length === 0;

  return { entries, isLoading, isFetching: community.isFetching, isError: community.isError, refetch: community.refetch };
}

export const usePyqFilterOptions = () =>
  useQuery({ queryKey: ["pyqFilters"], queryFn: library.getPyqFilterOptions, staleTime: 5 * 60_000 });

const PYQ_PAGE = 24;

/** PYQs run to thousands of rows, so they're filtered and paged on the server. */
export function usePyqs(filters: LibraryFilters, enabled = true) {
  const query = useInfiniteQuery({
    queryKey: ["pyqs", filters],
    queryFn: ({ pageParam, signal }) =>
      library.browsePyqs(
        {
          page: pageParam,
          limit: PYQ_PAGE,
          query: filters.query.trim() || undefined,
          program: filters.program ?? undefined,
          courseCode: filters.courseCode.trim() || undefined,
          year: filters.year ?? undefined,
          semester: filters.semester ?? undefined,
        },
        signal,
      ),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.pagination.hasMore ? last.pagination.page + 1 : undefined),
    placeholderData: keepPreviousData,
    enabled,
  });

  const entries = useMemo(
    () => (query.data?.pages ?? []).flatMap((pg) => pg.pyqs.map((r) => fromResource("pyqs", r))),
    [query.data],
  );
  const total = query.data?.pages[0]?.pagination.total ?? 0;

  return { ...query, entries, total };
}

export const usePyq = (id: string) =>
  useQuery({ queryKey: ["pyq", id], queryFn: () => library.getPyq(id), enabled: Boolean(id) });

export function useMyResources(kind: ResourceKind, enabled = true) {
  return useQuery({ queryKey: ["mine", kind], queryFn: () => library.listMine(kind), enabled });
}

export function useGlobalSearch(params: library.SearchParams, enabled: boolean) {
  return useQuery({
    queryKey: ["search", params],
    queryFn: ({ signal }) => library.searchAll(params, signal),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}

export const searchResultToEntry = (r: SearchResult): LibraryEntry => {
  const kind = (["notes", "pyqs", "syllabus"].includes(r.resourceType ?? "") ? r.resourceType : "notes") as ResourceKind;
  return {
    key: `${kind}:${r._id}`,
    kind,
    title: r.courseName || r.title,
    code: r.courseCode,
    semester: Number(r.semester),
    year: r.year,
    program: r.program,
    files: r.fileUrl ? [r.fileUrl] : [],
    source: "community",
    resourceId: r._id,
    contributor: typeof r.userId === "object" ? r.userId.username : undefined,
  };
};
