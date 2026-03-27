export type ComplianceNoteType =
  | 'GST'
  | 'HSN'
  | 'TCS'
  | 'POLICY'
  | 'CAMPAIGN'
  | 'WARNING'
  | 'GENERAL';

export type ComplianceNotePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ComplianceNoteStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export type ComplianceNoteSource = 'MANUAL' | 'AUTO_DRAFT';

export type ComplianceNoteAttachment = {
  id: string;
  name: string;
  uploadedAt?: string;
  downloadUrl?: string;
  url?: string;
};

export type ComplianceImpactProduct = {
  id: number;
  title?: string;
  uiCategoryKey?: string;
  subcategoryKey?: string;
  active?: boolean;
};

export type ComplianceNote = {
  id: number;
  title: string;
  noteType: ComplianceNoteType;
  priority: ComplianceNotePriority;
  shortSummary: string;
  fullNote: string;
  effectiveDate?: string;
  actionRequired?: string;
  affectedCategory?: string;
  attachments: ComplianceNoteAttachment[];
  businessEmail: string;
  status: ComplianceNoteStatus;
  pinned: boolean;
  sourceMode: ComplianceNoteSource;
  read?: boolean;
  acknowledged?: boolean;
  acknowledgedAt?: string;
  impactedProductCount?: number;
  impactedProducts?: ComplianceImpactProduct[];
  acknowledgedCount?: number;
  acknowledgementRatePercentage?: number;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
  archivedAt?: string;
};

export type ComplianceNoteDraftInput = {
  id?: number;
  title: string;
  noteType: ComplianceNoteType;
  priority: ComplianceNotePriority;
  shortSummary: string;
  fullNote: string;
  effectiveDate?: string;
  actionRequired?: string;
  affectedCategory?: string;
  attachments?: ComplianceNoteAttachment[];
  businessEmail: string;
  status: ComplianceNoteStatus;
  pinned?: boolean;
  sourceMode?: ComplianceNoteSource;
};

export type SellerNotesTab = 'latest' | 'unread' | 'archived';

export type ComplianceNoteImpactSummary = {
  affectedCategory?: string;
  impactedProductCount: number;
  coverageScope?: string;
  impactedProducts: ComplianceImpactProduct[];
};

export type ComplianceAnalyticsSummary = {
  totalNotes: number;
  draftCount: number;
  publishedCount: number;
  archivedCount: number;
  highPriorityCount: number;
  sellerCount: number;
  readRatePercentage: number;
  acknowledgementRatePercentage: number;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
  impactTopNotes: Array<{
    noteId: number;
    title?: string;
    noteType?: string;
    priority?: string;
    affectedCategory?: string;
    impactedProductCount?: number;
    impactedSellerCount?: number;
    acknowledgementRatePercentage?: number;
  }>;
};

export type ComplianceAnalyticsFilters = {
  noteType?: ComplianceNoteType | 'ALL';
  fromDate?: string;
  toDate?: string;
  minImpactedSellers?: number;
};
