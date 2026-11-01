import { api } from "./client";
import type { UploadFile } from "./auth";
import type {
  Envelope,
  LibraryResource,
  PyqFilterOptions,
  ResourceKind,
  SearchResult,
} from "./types";

/**
 * Notes, PYQs and syllabus share one backend resource factory, so they differ
 * only in their paths and in the key their list comes back under.
 */
interface KindConfig {
  all: string;
  search: string;
  mine: string;
  upload: string;
  edit: (id: string) => string;
  remove: (id: string) => string;
  listKey: string;
  mineKey: string;
  singularKey: string;
}

const KINDS: Record<ResourceKind, KindConfig> = {
  notes: {
    all: "/notes/all-notes",
    search: "/notes/search-notes",
    mine: "/notes/my-notes",
    upload: "/notes",
    edit: (id) => `/notes/${id}`,
    remove: (id) => `/notes/${id}`,
    listKey: "notes",
    mineKey: "notes",
    singularKey: "note",
  },
  pyqs: {
    all: "/pyqs/all-pyqs",
    search: "/pyqs/search-pyqs",
    mine: "/pyqs/my-pyqs",
    upload: "/pyqs/upload-pyqs",
    edit: (id) => `/pyqs/edit-pyqs/${id}`,
    remove: (id) => `/pyqs/delete-pyqs/${id}`,
    listKey: "pyqs",
    mineKey: "pyqs",
    singularKey: "pyq",
  },
  syllabus: {
    all: "/syllabus/all-syllabus",
    search: "/syllabus/search-syllabus",
    mine: "/syllabus/my-syllabus",
    upload: "/syllabus/upload-syllabus",
    edit: (id) => `/syllabus/edit-syllabus/${id}`,
    remove: (id) => `/syllabus/delete-syllabus/${id}`,
    listKey: "syllabuses",
    mineKey: "syllabus",
    singularKey: "syllabus",
  },
};

export interface ResourceFilters {
  query?: string;
  program?: string;
  courseCode?: string;
  semester?: string;
  year?: string;
}

const clean = <T extends Record<string, unknown>>(params: T) =>
  Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ""),
  );

/** Approved community uploads. The endpoint has no paging, only a limit. */
export const listCommunity = async (kind: ResourceKind, limit = 100) => {
  const cfg = KINDS[kind];
  const res = await api.get<Record<string, LibraryResource[]>>(cfg.all, {
    params: { limit },
  });
  return res.data[cfg.listKey] ?? [];
};

export const searchCommunity = async (kind: ResourceKind, filters: ResourceFilters) => {
  const cfg = KINDS[kind];
  const res = await api.get<Record<string, LibraryResource[]>>(cfg.search, {
    params: clean({ ...filters }),
  });
  return res.data[cfg.listKey] ?? [];
};

export const listMine = async (kind: ResourceKind) => {
  const cfg = KINDS[kind];
  const res = await api.get<Record<string, LibraryResource[]>>(cfg.mine);
  return res.data[cfg.mineKey] ?? [];
};

export interface ResourceInput {
  title: string;
  program: string;
  courseCode: string;
  courseName: string;
  semester: number;
  /** Not used by syllabus. */
  year?: string;
  /** Optional on edit — omit to keep the existing file. */
  file?: UploadFile;
}

const buildResourceForm = (input: ResourceInput) => {
  const form = new FormData();
  form.append("title", input.title);
  form.append("program", input.program);
  form.append("courseCode", input.courseCode);
  form.append("courseName", input.courseName);
  form.append("semester", String(input.semester));
  if (input.year) form.append("year", input.year);
  if (input.file) form.append("file", input.file as unknown as Blob);
  return form;
};

// Study material can be up to 100 MB, so uploads outlive the default timeout.
const uploadConfig = (onProgress?: (fraction: number) => void) => ({
  headers: { "Content-Type": "multipart/form-data" },
  transformRequest: (d: unknown) => d,
  timeout: 600_000,
  onUploadProgress: (e: { loaded: number; total?: number }) =>
    onProgress?.(e.total ? e.loaded / e.total : 0),
});

export const uploadResource = async (
  kind: ResourceKind,
  input: ResourceInput,
  onProgress?: (fraction: number) => void,
) => {
  const cfg = KINDS[kind];
  const res = await api.post<Record<string, LibraryResource>>(
    cfg.upload,
    buildResourceForm(input),
    uploadConfig(onProgress),
  );
  return res.data[cfg.singularKey];
};

export const updateResource = async (
  kind: ResourceKind,
  id: string,
  input: ResourceInput,
  onProgress?: (fraction: number) => void,
) => {
  const cfg = KINDS[kind];
  const res = await api.put<Record<string, LibraryResource>>(
    cfg.edit(id),
    buildResourceForm(input),
    uploadConfig(onProgress),
  );
  return res.data[cfg.singularKey];
};

export const deleteResource = (kind: ResourceKind, id: string) =>
  api.delete(KINDS[kind].remove(id));

/* ───────────────────────────── PYQs ───────────────────────────── */

export interface PyqBrowseParams {
  page?: number;
  limit?: number;
  program?: string;
  semester?: string;
  year?: string;
  courseCode?: string;
  query?: string;
}

export interface PyqPage {
  pyqs: LibraryResource[];
  pagination: { page: number; limit: number; total: number; totalPages: number; hasMore: boolean };
}

/** Server-side filtered, paged browse — the PYQ collection runs to thousands. */
export const browsePyqs = async (params: PyqBrowseParams, signal?: AbortSignal) => {
  const res = await api.get<Envelope<PyqPage>>("/pyqs/browse-pyqs", {
    params: clean({ ...params }),
    signal,
  });
  return res.data.data;
};

export const getPyqFilterOptions = async () => {
  const res = await api.get<Envelope<PyqFilterOptions>>("/pyqs/pyq-filters");
  return res.data.data;
};

export const getPyq = async (id: string) => {
  const res = await api.get<Envelope<{ pyq: LibraryResource }>>(`/pyqs/paper/${id}`);
  return res.data.data.pyq;
};

/* ────────────────────────── Global search ────────────────────────── */

export interface SearchParams extends ResourceFilters {
  query: string;
  type?: "all" | ResourceKind;
  courseName?: string;
}

/**
 * The endpoint returns bare documents with no marker of which collection they
 * came from, so an "all" search is run as one request per kind and each
 * result is tagged — otherwise a mixed list couldn't be told apart.
 */
export const searchAll = async (params: SearchParams, signal?: AbortSignal) => {
  const kinds: ResourceKind[] =
    !params.type || params.type === "all" ? ["notes", "pyqs", "syllabus"] : [params.type];

  const groups = await Promise.all(
    kinds.map(async (kind) => {
      const res = await api.get<{ results?: SearchResult[] }>("/resources/search", {
        params: clean({ ...params, type: kind }),
        signal,
      });
      return (res.data.results ?? []).map((r) => ({ ...r, resourceType: kind }));
    }),
  );
  return groups.flat();
};
