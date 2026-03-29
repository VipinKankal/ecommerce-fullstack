import { api } from 'shared/api/Api';
import { API_ROUTES } from 'shared/api/ApiRoutes';
import { getErrorMessage } from 'State/backend/masterApi/shared';
import {
  ComplianceAnalyticsFilters,
  ComplianceAnalyticsSummary,
  ComplianceNote,
  ComplianceNoteAttachment,
  ComplianceNoteDraftInput,
  ComplianceNoteImpactSummary,
  ComplianceNoteStatus,
  SellerNotesTab,
} from './types';

const CHANGE_EVENT = 'compliance-notes-updated';

let adminNotesCache: ComplianceNote[] = [];
let sellerNotesCache: ComplianceNote[] = [];
let sellerUnreadCountCache = 0;
let sellerAcknowledgedCountCache = 0;

const dispatchChange = () => {
  globalThis.dispatchEvent(new CustomEvent(CHANGE_EVENT));
};

const allowedNoteTypes: ComplianceNote['noteType'][] = [
  'GST',
  'HSN',
  'TCS',
  'POLICY',
  'CAMPAIGN',
  'WARNING',
  'GENERAL',
];
const allowedPriorities: ComplianceNote['priority'][] = [
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL',
];
const allowedStatuses: ComplianceNote['status'][] = [
  'DRAFT',
  'PUBLISHED',
  'ARCHIVED',
];
const allowedSources: ComplianceNote['sourceMode'][] = [
  'MANUAL',
  'AUTO_DRAFT',
];

const toRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

const coerceEnumValue = <T extends string>(
  value: unknown,
  allowedValues: readonly T[],
  fallback: T,
): T => {
  if (typeof value !== 'string') return fallback;
  const normalized = value.trim().toUpperCase() as T;
  return allowedValues.includes(normalized) ? normalized : fallback;
};

const normalizeAttachment = (raw: unknown): ComplianceNoteAttachment => {
  const source = toRecord(raw);
  return {
    id: String(source.id || ''),
    name: String(source.name || 'Attachment'),
    uploadedAt: source.uploadedAt ? String(source.uploadedAt) : undefined,
    downloadUrl: source.downloadUrl ? String(source.downloadUrl) : undefined,
    url: source.url ? String(source.url) : undefined,
  };
};

const normalizeNote = (raw: unknown): ComplianceNote => {
  const source = toRecord(raw);
  const attachments = source.attachments;
  const impactedProducts = source.impactedProducts;

  return {
    id: Number(source.id || 0),
    title: String(source.title || ''),
    noteType: coerceEnumValue(source.noteType, allowedNoteTypes, 'GENERAL'),
    priority: coerceEnumValue(source.priority, allowedPriorities, 'MEDIUM'),
    shortSummary: String(source.shortSummary || ''),
    fullNote: String(source.fullNote || ''),
    effectiveDate: source.effectiveDate ? String(source.effectiveDate) : undefined,
    actionRequired: source.actionRequired ? String(source.actionRequired) : undefined,
    affectedCategory: source.affectedCategory ? String(source.affectedCategory) : undefined,
    attachments: Array.isArray(attachments)
      ? attachments.map(normalizeAttachment)
      : [],
    businessEmail: String(source.businessEmail || ''),
    status: coerceEnumValue(source.status, allowedStatuses, 'DRAFT'),
    pinned: Boolean(source.pinned),
    sourceMode: coerceEnumValue(
      source.sourceMode || source.source,
      allowedSources,
      'MANUAL',
    ),
    read: source.read == null ? undefined : Boolean(source.read),
    acknowledged:
      source.acknowledged == null ? undefined : Boolean(source.acknowledged),
    acknowledgedAt: source.acknowledgedAt
      ? String(source.acknowledgedAt)
      : undefined,
    impactedProductCount:
      source.impactedProductCount == null
        ? undefined
        : Number(source.impactedProductCount),
    impactedProducts: Array.isArray(impactedProducts)
      ? (impactedProducts as ComplianceNote['impactedProducts'])
      : undefined,
    acknowledgedCount:
      source.acknowledgedCount == null
        ? undefined
        : Number(source.acknowledgedCount),
    acknowledgementRatePercentage:
      source.acknowledgementRatePercentage == null
        ? undefined
        : Number(source.acknowledgementRatePercentage),
    createdBy: source.createdBy ? String(source.createdBy) : undefined,
    updatedBy: source.updatedBy ? String(source.updatedBy) : undefined,
    createdAt: source.createdAt ? String(source.createdAt) : undefined,
    updatedAt: source.updatedAt ? String(source.updatedAt) : undefined,
    publishedAt: source.publishedAt ? String(source.publishedAt) : undefined,
    archivedAt: source.archivedAt ? String(source.archivedAt) : undefined,
  };
};

const sortNotes = (notes: ComplianceNote[]) =>
  [...notes].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    const timeA = new Date(a.publishedAt || a.updatedAt || a.createdAt || 0).getTime();
    const timeB = new Date(b.publishedAt || b.updatedAt || b.createdAt || 0).getTime();
    return timeB - timeA;
  });

const noteIdToNumber = (noteId: number | string) =>
  typeof noteId === 'number' ? noteId : Number(noteId);

const toPayload = (payload: ComplianceNoteDraftInput) => ({
  title: payload.title,
  noteType: payload.noteType,
  priority: payload.priority,
  shortSummary: payload.shortSummary,
  fullNote: payload.fullNote,
  effectiveDate: payload.effectiveDate || undefined,
  actionRequired: payload.actionRequired || undefined,
  affectedCategory: payload.affectedCategory || undefined,
  businessEmail: payload.businessEmail,
  status: payload.status,
  pinned: Boolean(payload.pinned),
  sourceMode: payload.sourceMode || 'MANUAL',
  attachments: (payload.attachments || []).map((item) => ({
    id: item.id,
    name: item.name,
    url: item.url || item.downloadUrl,
    uploadedAt: item.uploadedAt,
  })),
});

export const subscribeComplianceNotes = (listener: () => void) => {
  const wrapped = () => listener();
  globalThis.addEventListener(CHANGE_EVENT, wrapped as EventListener);
  return () =>
    globalThis.removeEventListener(CHANGE_EVENT, wrapped as EventListener);
};

export const listComplianceNotes = () => sortNotes(adminNotesCache);

export const countComplianceNotesByStatus = (status: ComplianceNoteStatus) =>
  adminNotesCache.filter((note) => note.status === status).length;

export const getComplianceNoteById = (noteId: number | string) => {
  const target = noteIdToNumber(noteId);
  return (
    adminNotesCache.find((note) => note.id === target) ||
    sellerNotesCache.find((note) => note.id === target) ||
    null
  );
};

export const fetchAdminComplianceNotes = async (params?: {
  status?: string;
  noteType?: string;
  query?: string;
}) => {
  const response = await api.get(API_ROUTES.admin.complianceNotes.base, {
    params: {
      status: params?.status,
      noteType: params?.noteType,
      q: params?.query,
    },
  });
  adminNotesCache = sortNotes(
    Array.isArray(response.data) ? response.data.map(normalizeNote) : [],
  );
  return adminNotesCache;
};

export const upsertComplianceNote = async (
  payload: ComplianceNoteDraftInput,
): Promise<ComplianceNote> => {
  const requestPayload = toPayload(payload);
  const response = payload.id
    ? await api.put(API_ROUTES.admin.complianceNotes.byId(payload.id), requestPayload)
    : await api.post(API_ROUTES.admin.complianceNotes.base, requestPayload);
  const note = normalizeNote(response.data);
  dispatchChange();
  await fetchAdminComplianceNotes();
  return note;
};

export const markComplianceNotePublished = async (noteId: number | string) => {
  await api.patch(API_ROUTES.admin.complianceNotes.publish(noteIdToNumber(noteId)));
  await fetchAdminComplianceNotes();
  dispatchChange();
};

export const markComplianceNoteArchived = async (noteId: number | string) => {
  await api.patch(API_ROUTES.admin.complianceNotes.archive(noteIdToNumber(noteId)));
  await fetchAdminComplianceNotes();
  dispatchChange();
};

export const createAutoDraftComplianceNote = async (payload: {
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
    sourceMode: 'AUTO_DRAFT',
  });

export const listSellerComplianceNotes = async (params: {
  sellerId?: string;
  tab: SellerNotesTab;
  searchText?: string;
  noteType?: string;
}) => {
  const tab = params.tab.toUpperCase();
  const response = await api.get(API_ROUTES.sellerComplianceNotes.base, {
    params: {
      tab,
      noteType: params.noteType || undefined,
      q: params.searchText || undefined,
    },
  });
  sellerNotesCache = sortNotes(
    Array.isArray(response.data) ? response.data.map(normalizeNote) : [],
  );
  return sellerNotesCache;
};

export const fetchSellerComplianceNoteById = async (noteId: number | string) => {
  const response = await api.get(API_ROUTES.sellerComplianceNotes.byId(noteIdToNumber(noteId)));
  const note = normalizeNote(response.data);
  const existingIndex = sellerNotesCache.findIndex((item) => item.id === note.id);
  if (existingIndex >= 0) {
    sellerNotesCache[existingIndex] = note;
  } else {
    sellerNotesCache = [note, ...sellerNotesCache];
  }
  return note;
};

export const markSellerComplianceNoteRead = async (noteId: number | string) => {
  await api.patch(API_ROUTES.sellerComplianceNotes.read(noteIdToNumber(noteId)));
  dispatchChange();
};

export const markSellerComplianceNoteUnread = async (noteId: number | string) => {
  await api.patch(API_ROUTES.sellerComplianceNotes.unread(noteIdToNumber(noteId)));
  dispatchChange();
};

export const acknowledgeSellerComplianceNote = async (noteId: number | string) => {
  await api.patch(API_ROUTES.sellerComplianceNotes.acknowledge(noteIdToNumber(noteId)));
  dispatchChange();
};

export const unacknowledgeSellerComplianceNote = async (noteId: number | string) => {
  await api.patch(API_ROUTES.sellerComplianceNotes.unacknowledge(noteIdToNumber(noteId)));
  dispatchChange();
};

export const fetchSellerComplianceUnreadCount = async () => {
  try {
    const response = await api.get(API_ROUTES.sellerComplianceNotes.unreadCount);
    sellerUnreadCountCache = Number(response.data?.unreadCount || 0);
    return sellerUnreadCountCache;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Failed to load unread notes count'));
  }
};

export const getSellerComplianceUnreadCount = () => sellerUnreadCountCache;

export const fetchSellerComplianceAcknowledgedCount = async () => {
  try {
    const response = await api.get(API_ROUTES.sellerComplianceNotes.acknowledgedCount);
    sellerAcknowledgedCountCache = Number(response.data?.acknowledgedCount || 0);
    return sellerAcknowledgedCountCache;
  } catch (error: unknown) {
    throw new Error(
      getErrorMessage(error, 'Failed to load acknowledged notes count'),
    );
  }
};

export const getSellerComplianceAcknowledgedCount = () =>
  sellerAcknowledgedCountCache;

export const fetchComplianceNoteImpact = async (
  noteId: number | string,
): Promise<ComplianceNoteImpactSummary> => {
  const response = await api.get(
    API_ROUTES.admin.complianceNotes.impact(noteIdToNumber(noteId)),
  );
  return {
    affectedCategory: response.data?.affectedCategory || undefined,
    impactedProductCount: Number(response.data?.impactedProductCount || 0),
    coverageScope: response.data?.coverageScope || undefined,
    impactedProducts: Array.isArray(response.data?.impactedProducts)
      ? response.data.impactedProducts
      : [],
  };
};

export const fetchComplianceAnalytics = async (
  filters?: ComplianceAnalyticsFilters,
): Promise<ComplianceAnalyticsSummary> => {
    const response = await api.get(API_ROUTES.admin.complianceNotes.analytics, {
      params: {
        noteType:
          filters?.noteType && filters.noteType !== 'ALL'
            ? filters.noteType
            : undefined,
        fromDate: filters?.fromDate || undefined,
        toDate: filters?.toDate || undefined,
        minImpactedSellers:
          filters?.minImpactedSellers != null
            ? Math.max(0, filters.minImpactedSellers)
            : undefined,
      },
    });
    return {
      totalNotes: Number(response.data?.totalNotes || 0),
      draftCount: Number(response.data?.draftCount || 0),
      publishedCount: Number(response.data?.publishedCount || 0),
      archivedCount: Number(response.data?.archivedCount || 0),
      highPriorityCount: Number(response.data?.highPriorityCount || 0),
      sellerCount: Number(response.data?.sellerCount || 0),
      readRatePercentage: Number(response.data?.readRatePercentage || 0),
      acknowledgementRatePercentage: Number(
        response.data?.acknowledgementRatePercentage || 0,
      ),
      byType: response.data?.byType || {},
      byPriority: response.data?.byPriority || {},
      impactTopNotes: Array.isArray(response.data?.impactTopNotes)
        ? response.data.impactTopNotes
        : [],
    };
  };
