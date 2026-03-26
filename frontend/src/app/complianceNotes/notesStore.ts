import {
  ComplianceNote,
  ComplianceNoteDraftInput,
  ComplianceNoteStatus,
  SellerNotesTab,
} from './types';

const STORAGE_KEY = 'compliance_notes_store_v1';
const CHANGE_EVENT = 'compliance-notes-updated';

type ComplianceNotesStore = {
  notes: ComplianceNote[];
  sellerReadMap: Record<string, string[]>;
};

type SellerNotesFilter = {
  sellerId: string;
  tab: SellerNotesTab;
  searchText?: string;
  noteType?: string;
};

const emptyStore: ComplianceNotesStore = {
  notes: [],
  sellerReadMap: {},
};

const nowIso = () => new Date().toISOString();

const createId = () =>
  `cn_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

const canUseStorage = () =>
  typeof globalThis !== 'undefined' && globalThis.localStorage !== undefined;

const normalizeStatusDate = (
  previous: ComplianceNote | undefined,
  nextStatus: ComplianceNoteStatus,
) => {
  if (nextStatus === 'PUBLISHED') {
    return {
      publishedAt: previous?.publishedAt || nowIso(),
      archivedAt: undefined,
    };
  }

  if (nextStatus === 'ARCHIVED') {
    return {
      publishedAt: previous?.publishedAt,
      archivedAt: nowIso(),
    };
  }

  return {
    publishedAt: previous?.publishedAt,
    archivedAt: undefined,
  };
};

const readStore = (): ComplianceNotesStore => {
  if (!canUseStorage()) return emptyStore;
  const raw = globalThis.localStorage.getItem(STORAGE_KEY);
  if (!raw) return emptyStore;

  try {
    const parsed = JSON.parse(raw) as Partial<ComplianceNotesStore>;
    const notes = Array.isArray(parsed.notes) ? parsed.notes : [];
    const sellerReadMap =
      parsed.sellerReadMap && typeof parsed.sellerReadMap === 'object'
        ? parsed.sellerReadMap
        : {};
    return { notes, sellerReadMap };
  } catch {
    return emptyStore;
  }
};

const writeStore = (nextStore: ComplianceNotesStore) => {
  if (!canUseStorage()) return;
  globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextStore));
  globalThis.dispatchEvent(new CustomEvent(CHANGE_EVENT));
};

const sortNotes = (notes: ComplianceNote[]) =>
  [...notes].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    const dateA = new Date(
      a.publishedAt || a.updatedAt || a.createdAt || 0,
    ).getTime();
    const dateB = new Date(
      b.publishedAt || b.updatedAt || b.createdAt || 0,
    ).getTime();
    return dateB - dateA;
  });

const isReadBySeller = (noteId: string, sellerId: string, store: ComplianceNotesStore) =>
  (store.sellerReadMap[sellerId] || []).includes(noteId);

export const listComplianceNotes = () => sortNotes(readStore().notes);

export const countComplianceNotesByStatus = (status: ComplianceNoteStatus) =>
  readStore().notes.filter((note) => note.status === status).length;

export const upsertComplianceNote = (
  payload: ComplianceNoteDraftInput,
): ComplianceNote => {
  const store = readStore();
  const existing = payload.id
    ? store.notes.find((note) => note.id === payload.id)
    : undefined;
  const statusDates = normalizeStatusDate(existing, payload.status);
  const now = nowIso();

  const nextNote: ComplianceNote = {
    id: existing?.id || createId(),
    title: payload.title.trim(),
    noteType: payload.noteType,
    priority: payload.priority,
    shortSummary: payload.shortSummary.trim(),
    fullNote: payload.fullNote.trim(),
    effectiveDate: payload.effectiveDate || undefined,
    actionRequired: payload.actionRequired?.trim() || undefined,
    affectedCategory: payload.affectedCategory?.trim() || undefined,
    attachments: payload.attachments || existing?.attachments || [],
    businessEmail: payload.businessEmail.trim(),
    status: payload.status,
    pinned: Boolean(payload.pinned),
    source: payload.source || existing?.source || 'MANUAL',
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    publishedAt: statusDates.publishedAt,
    archivedAt: statusDates.archivedAt,
  };

  const notes = existing
    ? store.notes.map((note) => (note.id === existing.id ? nextNote : note))
    : [...store.notes, nextNote];

  writeStore({ ...store, notes });
  return nextNote;
};

export const createAutoDraftComplianceNote = (payload: {
  title: string;
  noteType: ComplianceNote['noteType'];
  effectiveDate?: string;
  affectedCategory?: string;
  summary: string;
  actionRequired?: string;
  businessEmail: string;
}) =>
  upsertComplianceNote({
    title: payload.title,
    noteType: payload.noteType,
    priority: 'HIGH',
    shortSummary: payload.summary,
    fullNote: `${payload.summary}\n\nThis draft was auto-generated from a compliance rule update and should be reviewed before publishing.`,
    effectiveDate: payload.effectiveDate,
    actionRequired: payload.actionRequired,
    affectedCategory: payload.affectedCategory,
    businessEmail: payload.businessEmail,
    status: 'DRAFT',
    pinned: false,
    source: 'AUTO_DRAFT',
  });

export const markComplianceNoteArchived = (noteId: string) => {
  const store = readStore();
  const target = store.notes.find((note) => note.id === noteId);
  if (!target) return;
  upsertComplianceNote({
    ...target,
    status: 'ARCHIVED',
  });
};

export const markComplianceNotePublished = (noteId: string) => {
  const store = readStore();
  const target = store.notes.find((note) => note.id === noteId);
  if (!target) return;
  upsertComplianceNote({
    ...target,
    status: 'PUBLISHED',
  });
};

export const getComplianceNoteById = (noteId: string) =>
  readStore().notes.find((note) => note.id === noteId) || null;

export const listSellerComplianceNotes = ({
  sellerId,
  tab,
  searchText,
  noteType,
}: SellerNotesFilter): ComplianceNote[] => {
  const store = readStore();
  const query = (searchText || '').trim().toLowerCase();
  const typeFilter = noteType || 'ALL';

  const matchingStatus = (note: ComplianceNote) => {
    const read = isReadBySeller(note.id, sellerId, store);
    if (tab === 'archived') return note.status === 'ARCHIVED';
    if (tab === 'unread') return note.status === 'PUBLISHED' && !read;
    return note.status === 'PUBLISHED';
  };

  return sortNotes(
    store.notes.filter((note) => {
      if (!matchingStatus(note)) return false;
      if (typeFilter !== 'ALL' && note.noteType !== typeFilter) return false;
      if (!query) return true;

      return (
        note.title.toLowerCase().includes(query) ||
        note.shortSummary.toLowerCase().includes(query) ||
        note.fullNote.toLowerCase().includes(query)
      );
    }),
  );
};

export const getSellerComplianceUnreadCount = (sellerId: string) => {
  const store = readStore();
  return store.notes.filter(
    (note) =>
      note.status === 'PUBLISHED' && !isReadBySeller(note.id, sellerId, store),
  ).length;
};

export const markSellerComplianceNoteRead = (sellerId: string, noteId: string) => {
  const store = readStore();
  const readList = store.sellerReadMap[sellerId] || [];
  if (readList.includes(noteId)) return;

  writeStore({
    ...store,
    sellerReadMap: {
      ...store.sellerReadMap,
      [sellerId]: [...readList, noteId],
    },
  });
};

export const markSellerComplianceNoteUnread = (
  sellerId: string,
  noteId: string,
) => {
  const store = readStore();
  const readList = store.sellerReadMap[sellerId] || [];
  if (!readList.includes(noteId)) return;

  writeStore({
    ...store,
    sellerReadMap: {
      ...store.sellerReadMap,
      [sellerId]: readList.filter((id) => id !== noteId),
    },
  });
};

export const isSellerComplianceNoteRead = (sellerId: string, noteId: string) =>
  isReadBySeller(noteId, sellerId, readStore());

export const subscribeComplianceNotes = (listener: () => void) => {
  const wrapped = () => listener();
  globalThis.addEventListener(CHANGE_EVENT, wrapped as EventListener);
  return () =>
    globalThis.removeEventListener(CHANGE_EVENT, wrapped as EventListener);
};

